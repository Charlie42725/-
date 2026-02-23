<?php
/**
 * Provably Fair 驗證腳本 (PHP) - Deck Shuffle v1
 *
 * 演算法：
 *   1. 建牌：按 variantId 升序，每個 variant 出現 stock 次
 *   2. 洗牌：Fisher-Yates，每步用 HMAC-SHA256(serverSeed, String(i))
 *      for i = len-1 downto 1:
 *        hash = HMAC-SHA256(serverSeed, String(i))
 *        j = hexdec(substr(hash, 0, 8)) % (i + 1)
 *        swap(deck[i], deck[j])
 *   3. 對應：ticket #N → deck[N-1]
 *
 * 使用方式：
 *   php verify.php < data.json
 *
 * JSON 格式（deck-shuffle-v1）：
 * {
 *   "serverSeed": "hex...",
 *   "serverSeedHash": "hex...",
 *   "variants": [
 *     { "id": 1, "initialStock": 5 },
 *     { "id": 2, "initialStock": 10 }
 *   ],
 *   "draws": [
 *     { "ticketNumber": 1, "variantId": 2 },
 *     ...
 *   ]
 * }
 */

// ─── Deck Shuffle v1 ───────────────────────────────────

function buildDeck(array $variants): array {
    // 按 id 升序排列
    usort($variants, function ($a, $b) {
        return $a['id'] - $b['id'];
    });

    $deck = [];
    foreach ($variants as $v) {
        $stock = $v['initialStock'] ?? $v['stock'] ?? 0;
        for ($i = 0; $i < $stock; $i++) {
            $deck[] = $v['id'];
        }
    }
    return $deck;
}

function shuffleDeck(array $deck, string $serverSeed): array {
    for ($i = count($deck) - 1; $i > 0; $i--) {
        $hash = hash_hmac('sha256', strval($i), $serverSeed);
        $j = intval(hexdec(substr($hash, 0, 8))) % ($i + 1);
        // swap
        $tmp = $deck[$i];
        $deck[$i] = $deck[$j];
        $deck[$j] = $tmp;
    }
    return $deck;
}

function getShuffledDeck(array $variants, string $serverSeed): array {
    return shuffleDeck(buildDeck($variants), $serverSeed);
}

function verify(array $data): array {
    $serverSeed     = $data['serverSeed'];
    $serverSeedHash = $data['serverSeedHash'] ?? null;
    $variants       = $data['variants'];
    $draws          = $data['draws'];

    // 驗證 serverSeedHash
    $seedHashMatch = true;
    if ($serverSeedHash !== null) {
        $computedHash = hash('sha256', $serverSeed);
        $seedHashMatch = ($computedHash === $serverSeedHash);
    }

    // 檢測演算法版本：如果 draws 中有 nonce 欄位且不為 null → legacy
    $hasLegacyDraws = false;
    foreach ($draws as $draw) {
        if (isset($draw['nonce']) && $draw['nonce'] !== null) {
            $hasLegacyDraws = true;
            break;
        }
    }

    if ($hasLegacyDraws) {
        return verifyLegacy($data);
    }

    // deck-shuffle-v1 驗證
    $deck = getShuffledDeck($variants, $serverSeed);

    $results = [];
    $passCount = 0;
    $failCount = 0;

    foreach ($draws as $draw) {
        $ticketNumber      = $draw['ticketNumber'];
        $expectedVariantId = $draw['variantId'];

        $computedVariantId = $deck[$ticketNumber - 1] ?? null;
        $pass = ($computedVariantId === $expectedVariantId);

        if ($pass) $passCount++; else $failCount++;

        $results[] = [
            'ticketNumber'      => $ticketNumber,
            'computedVariantId' => $computedVariantId,
            'expectedVariantId' => $expectedVariantId,
            'pass'              => $pass,
        ];
    }

    return [
        'algorithm'     => 'deck-shuffle-v1',
        'seedHashMatch' => $seedHashMatch,
        'totalDraws'    => count($draws),
        'passed'        => $passCount,
        'failed'        => $failCount,
        'allPassed'     => ($failCount === 0 && $seedHashMatch),
        'results'       => $results,
    ];
}

// ─── Legacy 演算法（向後相容）──────────────────────────

function computeDrawHashLegacy(string $serverSeed, string $clientSeed, int $nonce): string {
    $message = $clientSeed . ':' . $nonce;
    return hash_hmac('sha256', $message, $serverSeed);
}

function extractRollLegacy(string $hashHex, int $offset = 0): int {
    return intval(hexdec(substr($hashHex, $offset, 8)));
}

function selectVariantLegacy(int $roll, array $variants): int {
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

    return $variants[count($variants) - 1]['id'];
}

function verifyLegacy(array $data): array {
    $serverSeed     = $data['serverSeed'];
    $serverSeedHash = $data['serverSeedHash'] ?? null;
    $variants       = $data['variants'];
    $draws          = $data['draws'];

    $seedHashMatch = true;
    if ($serverSeedHash !== null) {
        $computedHash = hash('sha256', $serverSeed);
        $seedHashMatch = ($computedHash === $serverSeedHash);
    }

    usort($variants, function ($a, $b) {
        return $a['id'] - $b['id'];
    });

    $remaining = [];
    foreach ($variants as $v) {
        $remaining[$v['id']] = $v['initialStock'];
    }

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

        $hash = computeDrawHashLegacy($serverSeed, $clientSeed, $nonce);
        $hashMatch = ($expectedHash === null) || ($hash === $expectedHash);

        $roll = extractRollLegacy($hash);

        $currentVariants = [];
        foreach ($variants as $v) {
            $rem = $remaining[$v['id']];
            if ($rem > 0) {
                $currentVariants[] = ['id' => $v['id'], 'remaining' => $rem];
            }
        }

        $computedVariantId = selectVariantLegacy($roll, $currentVariants);
        $variantMatch = ($computedVariantId === $expectedVariantId);

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
        'algorithm'     => 'legacy',
        'seedHashMatch' => $seedHashMatch,
        'totalDraws'    => count($draws),
        'passed'        => $passCount,
        'failed'        => $failCount,
        'allPassed'     => ($failCount === 0 && $seedHashMatch),
        'results'       => $results,
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
    fwrite(STDERR, "演算法: {$result['algorithm']}\n");
    if (isset($result['seedHashMatch'])) {
        fwrite(STDERR, "Seed Hash: " . ($result['seedHashMatch'] ? '匹配' : '不匹配') . "\n");
    }
    fwrite(STDERR, "總抽數: {$result['totalDraws']}\n");
    fwrite(STDERR, "通過:   {$result['passed']}\n");
    fwrite(STDERR, "失敗:   {$result['failed']}\n");
    fwrite(STDERR, $result['allPassed'] ? "✓ 全部通過\n" : "✗ 有失敗項目\n");

    exit($result['allPassed'] ? 0 : 1);
}
