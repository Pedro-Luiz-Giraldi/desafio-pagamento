package com.acaboumony.order.mapper;

import com.acaboumony.order.domain.entity.Order;
import com.acaboumony.order.domain.entity.OrderItem;
import com.acaboumony.order.dto.response.OrderDetailResponse;
import com.acaboumony.order.dto.response.OrderResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {
        var items = order.getItems().stream()
                .map(this::toItemResponse)
                .toList();
        return new OrderResponse(
                order.getId(),
                order.getStatus().name(),
                order.getTotalInCents(),
                items,
                order.getExpiresAt(),
                order.getCreatedAt()
        );
    }

    public OrderDetailResponse toDetailResponse(Order order) {
        var items = order.getItems().stream()
                .map(this::toDetailItemResponse)
                .toList();
        return new OrderDetailResponse(
                order.getId(),
                order.getCustomerId(),
                order.getMerchantId(),
                order.getStatus().name(),
                order.getTotalInCents(),
                items,
                order.getTransactionId(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getExpiresAt()
        );
    }

    private OrderResponse.ItemResponse toItemResponse(OrderItem item) {
        return new OrderResponse.ItemResponse(
                item.getProductId(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnitPriceInCents(),
                item.getSubtotalInCents()
        );
    }

    private OrderDetailResponse.ItemResponse toDetailItemResponse(OrderItem item) {
        return new OrderDetailResponse.ItemResponse(
                item.getProductId(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnitPriceInCents(),
                item.getSubtotalInCents()
        );
    }

    public List<OrderResponse> toResponseList(List<Order> orders) {
        return orders.stream().map(this::toResponse).toList();
    }
}
