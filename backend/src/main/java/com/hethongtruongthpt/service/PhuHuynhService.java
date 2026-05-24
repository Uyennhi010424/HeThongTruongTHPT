package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PhuHuynhService {
    private final PhuHuynhRepository phuHuynhRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PhuHuynhService(PhuHuynhRepository phuHuynhRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.phuHuynhRepository = phuHuynhRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<PhuHuynh> getAll() {
        return phuHuynhRepository.findAll();
    }

    public PhuHuynh getById(Integer id) {
        return phuHuynhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phụ huynh"));
    }

    public PhuHuynh create(PhuHuynh phuHuynh) {
        if (phuHuynh.getHoTen() == null || phuHuynh.getHoTen().isBlank()) {
            throw new ApiException("Thiếu họ tên phụ huynh");
        }

        if (phuHuynh.getSoDienThoai() == null || phuHuynh.getSoDienThoai().isBlank()) {
            throw new ApiException("Thiếu số điện thoại phụ huynh");
        }

        if (phuHuynh.getUser() == null) {
            String username = phuHuynh.getEmail();
            if (username == null || username.isBlank()) {
                // fallback username from name
                String name = phuHuynh.getHoTen() == null ? "phuhuynh" : phuHuynh.getHoTen().replaceAll("\\s+", "").toLowerCase();
                username = name + System.currentTimeMillis() % 10000;
            }
            username = username.trim();
            Optional<User> existing = userRepository.findByUsername(username);
            User user;
            if (existing.isPresent()) {
                user = existing.get();
            } else {
                user = new User();
                user.setUsername(username);
                user.setPassword(passwordEncoder.encode("Abc1234@"));
                user.setRole(RoleEnum.PHU_HUYNH);
                user.setIsActive(true);
                user = userRepository.save(user);
            }
            phuHuynh.setUser(user);
        }

        if (phuHuynh.getQuanHe() == null) phuHuynh.setQuanHe("CHA");
        if (phuHuynh.getIsSmSActive() == null) phuHuynh.setIsSmSActive(true);

        return phuHuynhRepository.save(phuHuynh);
    }

    public PhuHuynh update(Integer id, PhuHuynh phuHuynh) {
        getById(id);
        phuHuynh.setId(id);
        return phuHuynhRepository.save(phuHuynh);
    }

    public void delete(Integer id) {
        phuHuynhRepository.deleteById(id);
    }
}
