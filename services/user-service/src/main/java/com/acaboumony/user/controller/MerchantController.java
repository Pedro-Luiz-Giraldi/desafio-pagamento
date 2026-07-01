package com.acaboumony.user.controller;

import com.acaboumony.user.dto.response.MerchantSummaryResponse;
import com.acaboumony.user.service.MerchantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchants")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping
    public ResponseEntity<List<MerchantSummaryResponse>> listMerchants() {
        return ResponseEntity.ok(merchantService.listActiveMerchants());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MerchantSummaryResponse> getMerchant(@PathVariable UUID id) {
        return ResponseEntity.ok(merchantService.getMerchantDetail(id));
    }
}
