package com.acaboumony.fraud.rules;

import com.acaboumony.fraud.dto.request.FraudAnalysisRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Fires when this is the customer's first purchase AND the amount is R$ 999,99 or more
 * (≥ 99 999 cents).
 * Adds 20 risk points.
 */
@Component
public class FirstPurchaseMaxValueRule implements FraudRule {

    private static final long MAX_FIRST_PURCHASE_CENTS = 99_999L;
    static final String KEY_PREFIX = "fraud:purchase_count:";

    @Override
    public int evaluate(FraudAnalysisRequest request, StringRedisTemplate redis) {
        String countStr = redis.opsForValue().get(KEY_PREFIX + request.customerId());
        boolean isFirstPurchase = countStr == null;
        return isFirstPurchase && request.amountInCents() >= MAX_FIRST_PURCHASE_CENTS ? 20 : 0;
    }

    @Override
    public String getReason() {
        return "FIRST_PURCHASE_MAX_VALUE";
    }

    @Override
    public int getScore() {
        return 20;
    }
}
