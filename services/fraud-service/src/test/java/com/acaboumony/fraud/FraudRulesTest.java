package com.acaboumony.fraud;

import com.acaboumony.fraud.dto.request.FraudAnalysisRequest;
import com.acaboumony.fraud.repository.IpBlacklistRepository;
import com.acaboumony.fraud.rules.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.mockito.quality.Strictness.LENIENT;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = LENIENT)
class FraudRulesTest {

    private static final UUID CUSTOMER_ID = UUID.randomUUID();
    private static final UUID MERCHANT_ID = UUID.randomUUID();

    @Mock StringRedisTemplate redis;
    @Mock ZSetOperations<String, String> zSetOps;
    @Mock ValueOperations<String, String> valueOps;
    @Mock SetOperations<String, String> setOps;
    @Mock IpBlacklistRepository ipBlacklistRepository;

    @BeforeEach
    void setUp() {
        lenient().when(redis.opsForZSet()).thenReturn(zSetOps);
        lenient().when(redis.opsForValue()).thenReturn(valueOps);
        lenient().when(redis.opsForSet()).thenReturn(setOps);
    }

    private FraudAnalysisRequest buildRequest(long amountCents, String fingerprint) {
        return new FraudAnalysisRequest(
                "txn-001", CUSTOMER_ID, MERCHANT_ID, amountCents,
                "pm_card_visa", "192.168.1.100",
                fingerprint, null, null
        );
    }

    // -------------------------------------------------------------------------
    // VelocityRule
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("VelocityRule")
    class VelocityRuleTests {

        final VelocityRule rule = new VelocityRule();

        @Test
        @DisplayName("returns 0 when velocity count is below threshold")
        void nao_dispara_quando_velocidade_abaixo_do_limite() {
            when(zSetOps.count(anyString(), anyDouble(), anyDouble())).thenReturn(2L);
            assertThat(rule.evaluate(buildRequest(100L, null), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 30 when velocity count equals threshold (exactly 3)")
        void dispara_quando_velocidade_igual_ao_limite() {
            when(zSetOps.count(anyString(), anyDouble(), anyDouble())).thenReturn(3L);
            assertThat(rule.evaluate(buildRequest(100L, null), redis)).isEqualTo(30);
        }

        @Test
        @DisplayName("returns 30 when velocity count exceeds threshold")
        void dispara_quando_velocidade_acima_do_limite() {
            when(zSetOps.count(anyString(), anyDouble(), anyDouble())).thenReturn(10L);
            assertThat(rule.evaluate(buildRequest(100L, null), redis)).isEqualTo(30);
        }

        @Test
        @DisplayName("reason is VELOCITY_EXCEEDED")
        void rule_reason_correto() {
            assertThat(rule.getReason()).isEqualTo("VELOCITY_EXCEEDED");
        }
    }

    // -------------------------------------------------------------------------
    // AmountAnomalyRule
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("AmountAnomalyRule")
    class AmountAnomalyRuleTests {

        final AmountAnomalyRule rule = new AmountAnomalyRule();

        @Test
        @DisplayName("skips when no historical average (new customer)")
        void nao_dispara_quando_media_zero() {
            when(valueOps.get(anyString())).thenReturn(null);
            assertThat(rule.evaluate(buildRequest(999_999L, null), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 25 when amount is exactly 5x average (rule uses >=)")
        void dispara_quando_valor_exatamente_cinco_vezes_media() {
            when(valueOps.get(anyString())).thenReturn("1000");
            assertThat(rule.evaluate(buildRequest(5_000L, null), redis)).isEqualTo(25);
        }

        @Test
        @DisplayName("returns 25 when amount is more than 5x average")
        void dispara_quando_valor_maior_que_cinco_vezes_media() {
            when(valueOps.get(anyString())).thenReturn("1000");
            assertThat(rule.evaluate(buildRequest(5_001L, null), redis)).isEqualTo(25);
        }

        @Test
        @DisplayName("reason is AMOUNT_ANOMALY")
        void rule_reason_correto() {
            assertThat(rule.getReason()).isEqualTo("AMOUNT_ANOMALY");
        }
    }

    // -------------------------------------------------------------------------
    // IpBlacklistRule
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("IpBlacklistRule")
    class IpBlacklistRuleTests {

        IpBlacklistRule rule;

        @BeforeEach
        void init() {
            rule = new IpBlacklistRule(ipBlacklistRepository);
        }

        @Test
        @DisplayName("returns 0 when IP is not blacklisted")
        void nao_dispara_quando_ip_nao_esta_na_lista() {
            when(setOps.isMember(anyString(), anyString())).thenReturn(false);
            when(ipBlacklistRepository.findByIpAddress(anyString())).thenReturn(Optional.empty());
            assertThat(rule.evaluate(buildRequest(100L, null), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 40 when IP is in Redis blacklist")
        void dispara_quando_ip_esta_na_lista_redis() {
            when(setOps.isMember(anyString(), anyString())).thenReturn(true);
            assertThat(rule.evaluate(buildRequest(100L, null), redis)).isEqualTo(40);
        }

        @Test
        @DisplayName("reason is IP_BLACKLISTED")
        void rule_reason_correto() {
            assertThat(rule.getReason()).isEqualTo("IP_BLACKLISTED");
        }
    }

    // -------------------------------------------------------------------------
    // NewDeviceHighValueRule
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("NewDeviceHighValueRule")
    class NewDeviceHighValueRuleTests {

        final NewDeviceHighValueRule rule = new NewDeviceHighValueRule();

        @Test
        @DisplayName("returns 0 when device fingerprint is null")
        void nao_dispara_sem_fingerprint() {
            assertThat(rule.evaluate(buildRequest(100_000L, null), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 0 when amount is at threshold (rule uses >)")
        void nao_dispara_quando_valor_igual_ao_limite() {
            when(setOps.isMember(anyString(), anyString())).thenReturn(false);
            assertThat(rule.evaluate(buildRequest(50_000L, "fp-abc"), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 15 when fingerprint present, unknown device, and amount over threshold")
        void dispara_com_fingerprint_novo_dispositivo_e_valor_alto() {
            when(setOps.isMember(anyString(), anyString())).thenReturn(false);
            assertThat(rule.evaluate(buildRequest(50_001L, "fp-abc"), redis)).isEqualTo(15);
        }

        @Test
        @DisplayName("returns 0 when fingerprint present but amount below threshold")
        void nao_dispara_com_fingerprint_e_valor_baixo() {
            assertThat(rule.evaluate(buildRequest(1_000L, "fp-abc"), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("reason is NEW_DEVICE_HIGH_VALUE")
        void rule_reason_correto() {
            assertThat(rule.getReason()).isEqualTo("NEW_DEVICE_HIGH_VALUE");
        }
    }

    // -------------------------------------------------------------------------
    // UnusualHourRule
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("UnusualHourRule")
    class UnusualHourRuleTests {

        final UnusualHourRule rule = new UnusualHourRule();

        @Test
        @DisplayName("rule returns 0 or 10 — never negative, never > 10")
        void retorna_zero_ou_dez_nunca_negativo() {
            int points = rule.evaluate(buildRequest(50_000L, null), redis);
            assertThat(points).isIn(0, 10);
        }

        @Test
        @DisplayName("returns 0 when amount is below threshold regardless of hour")
        void nao_dispara_para_valor_baixo() {
            int points = rule.evaluate(buildRequest(1_000L, null), redis);
            assertThat(points).isEqualTo(0);
        }

        @Test
        @DisplayName("reason is UNUSUAL_HOUR")
        void rule_reason_correto() {
            assertThat(rule.getReason()).isEqualTo("UNUSUAL_HOUR");
        }
    }

    // -------------------------------------------------------------------------
    // FirstPurchaseMaxValueRule
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("FirstPurchaseMaxValueRule")
    class FirstPurchaseMaxValueRuleTests {

        final FirstPurchaseMaxValueRule rule = new FirstPurchaseMaxValueRule();

        @Test
        @DisplayName("returns 0 when not first purchase (has history in Redis)")
        void nao_dispara_quando_nao_e_primeira_compra() {
            when(valueOps.get(anyString())).thenReturn("5");
            assertThat(rule.evaluate(buildRequest(99_999L, null), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 0 when first purchase but amount below threshold")
        void nao_dispara_quando_primeira_compra_valor_baixo() {
            when(valueOps.get(anyString())).thenReturn(null);
            assertThat(rule.evaluate(buildRequest(99_998L, null), redis)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 20 when first purchase and amount exactly at threshold")
        void dispara_quando_primeira_compra_valor_igual_ao_limite() {
            when(valueOps.get(anyString())).thenReturn(null);
            assertThat(rule.evaluate(buildRequest(99_999L, null), redis)).isEqualTo(20);
        }

        @Test
        @DisplayName("returns 20 when first purchase and amount above threshold")
        void dispara_quando_primeira_compra_valor_acima_do_limite() {
            when(valueOps.get(anyString())).thenReturn(null);
            assertThat(rule.evaluate(buildRequest(200_000L, null), redis)).isEqualTo(20);
        }

        @Test
        @DisplayName("reason is FIRST_PURCHASE_MAX_VALUE")
        void rule_reason_correto() {
            assertThat(rule.getReason()).isEqualTo("FIRST_PURCHASE_MAX_VALUE");
        }
    }
}
