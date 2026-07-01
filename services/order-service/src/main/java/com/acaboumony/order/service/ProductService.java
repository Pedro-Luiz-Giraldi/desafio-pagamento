package com.acaboumony.order.service;

import com.acaboumony.order.domain.entity.Product;
import com.acaboumony.order.domain.repository.ProductRepository;
import com.acaboumony.order.dto.response.ProductResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> listActiveProducts(UUID merchantId) {
        return productRepository.findByMerchantIdAndActiveTrueOrderByName(merchantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getProduct(UUID id) {
        return productRepository.findById(id)
                .filter(Product::isActive)
                .map(this::toResponse)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(), p.getMerchantId(), p.getName(),
                p.getDescription(), p.getPriceInCents(), p.isActive());
    }

    public static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(UUID id) {
            super("Product not found: " + id);
        }
    }
}
