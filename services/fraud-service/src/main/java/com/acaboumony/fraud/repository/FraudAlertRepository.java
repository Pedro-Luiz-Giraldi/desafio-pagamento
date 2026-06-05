package com.acaboumony.fraud.repository;

import com.acaboumony.fraud.domain.entity.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {

    List<FraudAlert> findByTransactionId(String transactionId);

    List<FraudAlert> findByCustomerId(UUID customerId);
}
