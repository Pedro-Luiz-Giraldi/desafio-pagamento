package com.acaboumony.order.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "order_items", schema = "order_service")
public class OrderItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private String productId;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price_in_cents", nullable = false)
    private Long unitPriceInCents;

    @Column(name = "subtotal_in_cents", nullable = false)
    private Long subtotalInCents;

    public OrderItem() {
    }

    public OrderItem(UUID id, Order order, String productId, String description,
                     Integer quantity, Long unitPriceInCents, Long subtotalInCents) {
        this.id = id;
        this.order = order;
        this.productId = productId;
        this.description = description;
        this.quantity = quantity;
        this.unitPriceInCents = unitPriceInCents;
        this.subtotalInCents = subtotalInCents;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    @JsonIgnore
    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Long getUnitPriceInCents() {
        return unitPriceInCents;
    }

    public void setUnitPriceInCents(Long unitPriceInCents) {
        this.unitPriceInCents = unitPriceInCents;
    }

    public Long getSubtotalInCents() {
        return subtotalInCents;
    }

    public void setSubtotalInCents(Long subtotalInCents) {
        this.subtotalInCents = subtotalInCents;
    }
}
