package com.acaboumony.order.domain.repository;

import com.acaboumony.order.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByMerchantIdAndActiveTrueOrderByName(UUID merchantId);
}
