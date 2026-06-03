package com.acaboumony.order.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    @Test
    void deve_conter_anotacao_openapi_com_titulo_correto() {
        var annotation = OpenApiConfig.class.getAnnotation(OpenAPIDefinition.class);
        assertThat(annotation).isNotNull();

        var info = annotation.info();
        assertThat(info.title()).isEqualTo("Order Service API");
        assertThat(info.version()).isEqualTo("1.0.0");
        assertThat(info.description()).contains("API for managing orders");
    }
}
