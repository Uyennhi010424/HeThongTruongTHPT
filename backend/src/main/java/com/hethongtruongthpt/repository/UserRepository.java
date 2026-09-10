package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRole(RoleEnum role);
    Optional<User> findByUsernameAndPassword(String username, String password);
}