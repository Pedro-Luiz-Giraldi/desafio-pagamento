package com.acaboumony.order.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;

@OpenAPIDefinition(
        info = @Info(
                title = "Order Service API",
                description = "API for managing orders in the Acabou o Mony payment platform",
                version = "1.0.0",
                contact = @Contact(
                        name = "Acabou o Mony Team",
                        email = "dev@acaboumony.com"
                ),
                license = @License(
                        name = "Proprietary"
                )
        )
)
public class OpenApiConfig {
}
