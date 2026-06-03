package com.acaboumony.order.controller;

import com.acaboumony.order.dto.ApiResponse;
import com.acaboumony.order.exception.InsufficientPermissionsException;
import com.acaboumony.order.exception.OrderCannotBeCancelledException;
import com.acaboumony.order.exception.OrderNotFoundException;
import com.acaboumony.order.service.OrderService.EmptyOrderException;
import com.acaboumony.order.service.OrderService.InvalidItemPriceException;
import com.acaboumony.order.service.OrderService.InvalidQuantityException;
import com.acaboumony.order.service.OrderService.OrderTotalExceedsLimitException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("ORDER_NOT_FOUND", "Order not found", false)
                )));
    }

    @ExceptionHandler(OrderCannotBeCancelledException.class)
    public ResponseEntity<ApiResponse<Void>> handleCannotCancel(OrderCannotBeCancelledException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("ORDER_CANNOT_BE_CANCELLED",
                                "Order cannot be cancelled in status " + ex.getStatus(), false)
                )));
    }

    @ExceptionHandler(InsufficientPermissionsException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(InsufficientPermissionsException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("INSUFFICIENT_PERMISSIONS", "Access denied", false)
                )));
    }

    @ExceptionHandler(EmptyOrderException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmptyOrder(EmptyOrderException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("EMPTY_ORDER", ex.getMessage(), false)
                )));
    }

    @ExceptionHandler(InvalidItemPriceException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidPrice(InvalidItemPriceException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("INVALID_ITEM_PRICE", "Invalid item price: " + ex.getPrice(), "unitPriceInCents", false)
                )));
    }

    @ExceptionHandler(InvalidQuantityException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidQuantity(InvalidQuantityException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("INVALID_QUANTITY", "Invalid quantity: " + ex.getQuantity(), "quantity", false)
                )));
    }

    @ExceptionHandler(OrderTotalExceedsLimitException.class)
    public ResponseEntity<ApiResponse<Void>> handleTotalExceeds(OrderTotalExceedsLimitException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("TOTAL_EXCEEDS_LIMIT", "Order total exceeds limit", false)
                )));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiResponse.ErrorDetail("INVALID_FIELD", fe.getDefaultMessage(), fe.getField(), false))
                .toList();
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(List.of(
                        new ApiResponse.ErrorDetail("INTERNAL_ERROR", "An unexpected error occurred", true)
                )));
    }
}
