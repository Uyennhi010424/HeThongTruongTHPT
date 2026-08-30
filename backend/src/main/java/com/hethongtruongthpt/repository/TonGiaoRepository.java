package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.TonGiao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TonGiaoRepository extends JpaRepository<TonGiao, Integer> {
    Optional<TonGiao> findByTenTonGiao(String tenTonGiao);
}
