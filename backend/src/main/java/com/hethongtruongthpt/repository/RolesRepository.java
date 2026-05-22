package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Roles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface RolesRepository extends JpaRepository<Roles, Integer> {
	Optional<Roles> findByRoleName(String roleName);

	@Query("select coalesce(max(r.id), 0) from Roles r")
	Integer findMaxId();
}