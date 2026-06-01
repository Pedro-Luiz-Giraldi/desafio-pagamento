package com.acaboumony.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import static org.assertj.core.api.Assertions.assertThat;

class WebClientConfigTest {

    @Test
    void deve_criar_webClient_com_baseUrl_e_internal_secret() {
        UserServiceProperties props = new UserServiceProperties(
                "http://localhost:8081", "my-secret");
        WebClientConfig config = new WebClientConfig(props);

        WebClient client = config.userServiceWebClient();

        assertThat(client).isNotNull();
    }
}
