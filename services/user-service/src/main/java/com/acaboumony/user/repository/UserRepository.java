package com.acaboumony.user.repository;

import com.acaboumony.user.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.merchant WHERE u.email = :email")
    Optional<User> findByEmailWithMerchant(@Param("email") String email);

    boolean existsByEmail(String email);
}
