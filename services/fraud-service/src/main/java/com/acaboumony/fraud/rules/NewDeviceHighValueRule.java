package com.acaboumony.fraud.rules;

import com.acaboumony.fraud.dto.request.FraudAnalysisRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Fires when a device fingerprint is present (potentially new/unknown device)
 * AND the transaction amount exceeds R$ 500,00 (50 000 cents).
 * Adds 15 risk points.
 */
@Component
public class NewDeviceHighValueRule implements FraudRule {

    private static final long HIGH_VALUE_THRESHOLD_CENTS = 50_000L;
    static final String KEY_PREFIX = "fraud:devices:";

    @Override
    public int evaluate(FraudAnalysisRequest request, StringRedisTemplate redis) {
        if (request.deviceFingerprint() == null || request.deviceFingerprint().isBlank()) {
            return 0;
        }
        if (request.amountInCents() <= HIGH_VALUE_THRESHOLD_CENTS) {
            return 0;
        }
        Boolean known = redis.opsForSet().isMember(KEY_PREFIX + request.customerId(), request.deviceFingerprint());
        return Boolean.FALSE.equals(known) ? 15 : 0;
    }

    @Override
    public String getReason() {
        return "NEW_DEVICE_HIGH_VALUE";
    }

    @Override
    public int getScore() {
        return 15;
    }
}
