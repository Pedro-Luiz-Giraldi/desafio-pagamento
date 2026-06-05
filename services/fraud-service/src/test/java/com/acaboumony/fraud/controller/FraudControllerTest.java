package com.acaboumony.fraud.controller;

import com.acaboumony.fraud.config.InternalSecretProperties;
import com.acaboumony.fraud.config.SecurityConfig;
import com.acaboumony.fraud.config.TestSecurityConfig;
import com.acaboumony.fraud.dto.request.FraudAnalysisRequest;
import com.acaboumony.fraud.dto.response.FraudScore;
import com.acaboumony.fraud.exception.GlobalExceptionHandler;
import com.acaboumony.fraud.security.InternalSecretFilter;
import com.acaboumony.fraud.service.FraudDetectionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = FraudController.class,
        excludeAutoConfiguration = SecurityAutoConfiguration.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class)
)
@Import({GlobalExceptionHandler.class, TestSecurityConfig.class, InternalSecretFilter.class})
class FraudControllerTest {

    static final String TEST_SECRET = "test-internal-secret";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean FraudDetectionService fraudDetection;
    @MockBean InternalSecretProperties internalSecretProperties;

    @BeforeEach
    void setUp() {
        when(internalSecretProperties.secret()).thenReturn(TEST_SECRET);
    }

    @Test
    void scoreEndpoint_shouldReturnFraudScore() throws Exception {
        FraudAnalysisRequest request = new FraudAnalysisRequest(
            "txn_001", UUID.randomUUID(), UUID.randomUUID(), 5000L,
            "visa", "192.168.1.1", null, null, null
        );

        FraudScore expected = new FraudScore(0, "APPROVE", List.of(), 10L);
        when(fraudDetection.score(any())).thenReturn(expected);

        mockMvc.perform(post("/internal/fraud/score")
                .header("X-Internal-Secret", TEST_SECRET)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.score").value(0))
            .andExpect(jsonPath("$.decision").value("APPROVE"));
    }

    @Test
    void scoreEndpoint_withInvalidRequest_shouldReturnBadRequest() throws Exception {
        String invalidJson = """
            {
                "transactionId": "",
                "amountInCents": null
            }
            """;

        mockMvc.perform(post("/internal/fraud/score")
                .header("X-Internal-Secret", TEST_SECRET)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }

    @Test
    void scoreEndpoint_withBlockedTransaction_shouldReturnBlockDecision() throws Exception {
        FraudAnalysisRequest request = new FraudAnalysisRequest(
            "txn_002", UUID.randomUUID(), UUID.randomUUID(), 5000L,
            "visa", "10.0.0.5", null, null, null
        );

        FraudScore expected = new FraudScore(95, "BLOCK", List.of("IP_BLACKLISTED", "VELOCITY_EXCEEDED"), 15L);
        when(fraudDetection.score(any())).thenReturn(expected);

        mockMvc.perform(post("/internal/fraud/score")
                .header("X-Internal-Secret", TEST_SECRET)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.score").value(95))
            .andExpect(jsonPath("$.decision").value("BLOCK"))
            .andExpect(jsonPath("$.reasons[0]").value("IP_BLACKLISTED"));
    }
}
