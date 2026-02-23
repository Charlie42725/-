<?php
/**
 * Cross-language test: PHP runner
 * Standalone implementation matching the algorithm in public/verify.php
 */

function buildDeck(array $variants): array {
    usort($variants, function ($a, $b) {
        return $a['id'] - $b['id'];
    });
    $deck = [];
    foreach ($variants as $v) {
        $stock = $v['stock'] ?? $v['initialStock'] ?? 0;
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
        $tmp = $deck[$i];
        $deck[$i] = $deck[$j];
        $deck[$j] = $tmp;
    }
    return $deck;
}

$serverSeed = 'test_seed_abc123';
$variants = [
    ['id' => 5, 'stock' => 3],
    ['id' => 8, 'stock' => 5],
    ['id' => 12, 'stock' => 2],
];

$deck = shuffleDeck(buildDeck($variants), $serverSeed);
echo json_encode(['language' => 'PHP', 'deck' => $deck]) . "\n";
