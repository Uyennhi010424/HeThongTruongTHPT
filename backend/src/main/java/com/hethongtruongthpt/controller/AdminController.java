package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final JdbcTemplate jdbcTemplate;

    public AdminController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/delete-all-students")
    @Transactional
    public ResponseEntity<ApiResponse<Object>> deleteAllStudents() {
        try {
            // locate script relative to project root
            Path script = Path.of(System.getProperty("user.dir")).getParent().resolve("scripts").resolve("delete-all-students.sql");
            if (!Files.exists(script)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Script not found: " + script.toString()));
            }

            String content = Files.readString(script);
            // split by semicolon and execute non-empty statements
            String[] parts = content.split(";");
            for (String p : parts) {
                String stmt = p.trim();
                if (stmt.isEmpty()) continue;
                // skip comment-only lines
                if (stmt.startsWith("--")) continue;
                jdbcTemplate.execute(stmt);
            }

            return ResponseEntity.ok(ApiResponse.ok("Deleted students and related data", null));
        } catch (IOException ex) {
            return ResponseEntity.status(500).body(ApiResponse.error("Could not read script: " + ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(ApiResponse.error("Execution error: " + ex.getMessage()));
        }
    }

    @PostMapping("/force-clean-students")
    @Transactional
    public ResponseEntity<ApiResponse<Object>> forceCleanStudents() {
        String[] stmts = new String[] {
                "SET FOREIGN_KEY_CHECKS=0",
                "DELETE FROM phu_huynh_hoc_sinh",
                "DELETE FROM diem_audit_log",
                "DELETE FROM diem",
                "DELETE FROM thong_bao",
                "DELETE FROM sms_log",
                "DELETE FROM ai_suggestions",
                "DELETE FROM hoc_sinh",
                "DELETE FROM users WHERE role = 'HOC_SINH'",
                "SET FOREIGN_KEY_CHECKS=1"
        };
        StringBuilder errors = new StringBuilder();
        for (String s : stmts) {
            try {
                if (s.startsWith("SET FOREIGN_KEY_CHECKS")) jdbcTemplate.execute(s);
                else jdbcTemplate.update(s);
            } catch (Exception ex) {
                errors.append(s).append(" -> ").append(ex.getMessage()).append("; ");
            }
        }
        if (errors.length() > 0) {
            return ResponseEntity.status(500).body(ApiResponse.error("Force-clean completed with errors: " + errors.toString()));
        }
        return ResponseEntity.ok(ApiResponse.ok("Force-clean completed", null));
    }
}
