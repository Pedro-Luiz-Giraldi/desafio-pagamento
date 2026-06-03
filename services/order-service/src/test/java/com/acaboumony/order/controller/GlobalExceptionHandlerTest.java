package com.acaboumony.order.controller;

import com.acaboumony.order.dto.ApiResponse;
import com.acaboumony.order.exception.InsufficientPermissionsException;
import com.acaboumony.order.exception.OrderCannotBeCancelledException;
import com.acaboumony.order.exception.OrderNotFoundException;
import com.acaboumony.order.service.OrderService.EmptyOrderException;
import com.acaboumony.order.service.OrderService.InvalidItemPriceException;
import com.acaboumony.order.service.OrderService.InvalidQuantityException;
import com.acaboumony.order.service.OrderService.OrderTotalExceedsLimitException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldHandleNotFound() {
        var response = handler.handleNotFound(new OrderNotFoundException(UUID.randomUUID()));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("ORDER_NOT_FOUND");
    }

    @Test
    void shouldHandleCannotCancel() {
        var response = handler.handleCannotCancel(
                new OrderCannotBeCancelledException(UUID.randomUUID(), "PAID"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("ORDER_CANNOT_BE_CANCELLED");
    }

    @Test
    void shouldHandleForbidden() {
        var response = handler.handleForbidden(
                new InsufficientPermissionsException("Access denied"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("INSUFFICIENT_PERMISSIONS");
    }

    @Test
    void shouldHandleEmptyOrder() {
        var response = handler.handleEmptyOrder(new EmptyOrderException());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("EMPTY_ORDER");
    }

    @Test
    void shouldHandleInvalidPrice() {
        var response = handler.handleInvalidPrice(new InvalidItemPriceException(0L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("INVALID_ITEM_PRICE");
    }

    @Test
    void shouldHandleInvalidQuantity() {
        var response = handler.handleInvalidQuantity(new InvalidQuantityException(0));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("INVALID_QUANTITY");
    }

    @Test
    void shouldHandleTotalExceeds() {
        var response = handler.handleTotalExceeds(new OrderTotalExceedsLimitException(1_000_000L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("TOTAL_EXCEEDS_LIMIT");
    }

    @Test
    void shouldHandleGeneral() {
        var response = handler.handleGeneral(new RuntimeException("Unexpected"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("INTERNAL_ERROR");
    }

    record TestDto(java.util.UUID merchantId) {
    }

    @Test
    void shouldHandleValidation() throws Exception {
        var method = GlobalExceptionHandlerTest.class.getDeclaredMethod("shouldHandleValidation");
        var parameter = new org.springframework.core.MethodParameter(method, -1);
        var target = new TestDto(null);
        var bindingResult = new org.springframework.validation.BeanPropertyBindingResult(target, "testDto");
        bindingResult.rejectValue("merchantId", "NOT_NULL", "must not be null");
        var ex = new org.springframework.web.bind.MethodArgumentNotValidException(parameter, bindingResult);

        var response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors().get(0).code()).isEqualTo("INVALID_FIELD");
    }
}
