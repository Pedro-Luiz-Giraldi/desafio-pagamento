package com.acaboumony.user.exception;

import java.util.UUID;

public class MerchantNotFoundException extends RuntimeException {
    public MerchantNotFoundException(UUID id) {
        super("Merchant not found: " + id);
    }
}
