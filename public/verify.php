<?php
/**
 * Provably Fair 驗證腳本 (PHP)
 *
 * 演算法：
 *   hash  = HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)
 *   roll  = hexdec(substr(hash, 0, 8))   ← 不需要 GMP
 *   index = roll % totalWeight
 *   → 按 variantId 升序累加 remaining，第一個累計 > index 的即中獎
 *
 * 使用方式：
 *   php verify.php < data.json
 *   或在程式中：verify($data)
 *
 * JSON 格式：
 * {
 *   "serverSeed": "hex...",
 *   "variants": [
 *     { "id": 1, "initialStock": 5 },
 *     { "id": 2, "initialStock": 10 }
 *   ],
 *   "draws": [
 *     { "nonce": 0, "clientSeed": "hex...", "variantId": 2, "hashResult": "hex..." },
 *     ...
 *   ]
 * }
 */

function computeDrawHash(string $serverSeed, string $clientSeed, int $nonce): string {
    $message = $clientSeed . ':' . $nonce;
    return hash_hmac('sha256', $message, $serverSeed);
}

function extractRoll(string $hashHex, int $offset = 0): int {
    // 取前 8 個 hex 字元 → 32-bit unsigned integer
    // PHP 在 64-bit 系統上 hexdec() 可安全處理 8 hex digits (最大 0xFFFFFFFF = 4294967295)
    return intval(hexdec(substr($hashHex, $offset, 8)));
}

function selectVariant(int $roll, array $variants): int {
    // $variants 必須已按 id 升序排列，每項有 'id' 和 'remaining'
    $totalWeight = 0;
    foreach ($variants as $v) {
        $totalWeight += $v['remaining'];
    }
    if ($totalWeight === 0) {
        throw new Exception('所有獎項已全部抽完');
    }

    $index = $roll % $totalWeight;
    $cumulative = 0;

    foreach ($variants as $v) {
        $cumulative += $v['remaining'];
        if ($cumulative > $index) {
            return $v['id'];
        }
    }

    // fallback
    return $variants[count($variants) - 1]['id'];
}

function verify(array $data): array {
    $serverSeed = $data['serverSeed'];
    $variants   = $data['variants'];
    $draws      = $data['draws'];

    // 按 id 升序排列 variants
    usort($variants, function ($a, $b) {
        return $a['id'] - $b['id'];
    });

    // 建立剩餘庫存 tracker
    $remaining = [];
    foreach ($variants as $v) {
        $remaining[$v['id']] = $v['initialStock'];
    }

    // 按 nonce 升序排列 draws
    usort($draws, function ($a, $b) {
        return $a['nonce'] - $b['nonce'];
    });

    $results = [];
    $passCount = 0;
    $failCount = 0;

    foreach ($draws as $draw) {
        $nonce      = $draw['nonce'];
        $clientSeed = $draw['clientSeed'];
        $expectedVariantId = $draw['variantId'];
        $expectedHash      = $draw['hashResult'] ?? null;

        // 計算 hash
        $hash = computeDrawHash($serverSeed, $clientSeed, $nonce);
        $hashMatch = ($expectedHash === null) || ($hash === $expectedHash);

        // 計算 roll
        $roll = extractRoll($hash);

        // 建立當前庫存快照
        $currentVariants = [];
        foreach ($variants as $v) {
            $rem = $remaining[$v['id']];
            if ($rem > 0) {
                $currentVariants[] = ['id' => $v['id'], 'remaining' => $rem];
            }
        }

        // 選擇 variant
        $computedVariantId = selectVariant($roll, $currentVariants);
        $variantMatch = ($computedVariantId === $expectedVariantId);

        // 更新庫存
        if (isset($remaining[$computedVariantId])) {
            $remaining[$computedVariantId]--;
        }

        $pass = $hashMatch && $variantMatch;
        if ($pass) $passCount++; else $failCount++;

        $results[] = [
            'nonce'             => $nonce,
            'clientSeed'        => $clientSeed,
            'hash'              => $hash,
            'hashMatch'         => $hashMatch,
            'roll'              => $roll,
            'computedVariantId' => $computedVariantId,
            'expectedVariantId' => $expectedVariantId,
            'variantMatch'      => $variantMatch,
            'pass'              => $pass,
        ];
    }

    return [
        'totalDraws' => count($draws),
        'passed'     => $passCount,
        'failed'     => $failCount,
        'allPassed'  => ($failCount === 0),
        'results'    => $results,
    ];
}

// ─── CLI 入口 ───────────────────────────────────
if (php_sapi_name() === 'cli') {
    $input = file_get_contents('php://stdin');
    if ($input === false || $input === '') {
        fwrite(STDERR, "Usage: php verify.php < data.json\n");
        fwrite(STDERR, "  或: echo '{...}' | php verify.php\n");
        exit(1);
    }

    $data = json_decode($input, true);
    if ($data === null) {
        fwrite(STDERR, "Error: 無法解析 JSON 輸入\n");
        exit(1);
    }

    if (empty($data['serverSeed']) || empty($data['variants']) || empty($data['draws'])) {
        fwrite(STDERR, "Error: JSON 必須包含 serverSeed, variants, draws\n");
        exit(1);
    }

    $result = verify($data);

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

    // 摘要
    fwrite(STDERR, "\n=== 驗證結果 ===\n");
    fwrite(STDERR, "總抽數: {$result['totalDraws']}\n");
    fwrite(STDERR, "通過:   {$result['passed']}\n");
    fwrite(STDERR, "失敗:   {$result['failed']}\n");
    fwrite(STDERR, $result['allPassed'] ? "✓ 全部通過\n" : "✗ 有失敗項目\n");

    exit($result['allPassed'] ? 0 : 1);
}
