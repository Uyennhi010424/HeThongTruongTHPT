package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.AiSuggestions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiSuggestionsRepository extends JpaRepository<AiSuggestions, Integer> {
    Optional<AiSuggestions> findByHocSinhIdAndHocKyAndNamHoc(Integer hocSinhId, Integer hocKy, String namHoc);
    List<AiSuggestions> findByHetHanLessThan(LocalDateTime now);
}
