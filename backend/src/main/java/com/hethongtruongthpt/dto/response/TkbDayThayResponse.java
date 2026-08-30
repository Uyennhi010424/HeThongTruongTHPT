package com.hethongtruongthpt.dto.response;

import com.hethongtruongthpt.entity.TkbDayThay;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TkbDayThayResponse {
    private Integer id;
    private ThoiKhoaBieuResponse thoiKhoaBieu;
    private ThoiKhoaBieuResponse.GiaoVienDto giaoVienThay;
    private LocalDate ngay;
    private String ghiChu;
    private LocalDateTime createdAt;

    public static TkbDayThayResponse fromEntity(TkbDayThay entity) {
        if (entity == null) return null;
        TkbDayThayResponse res = new TkbDayThayResponse();
        res.setId(entity.getId());
        res.setNgay(entity.getNgay());
        res.setGhiChu(entity.getGhiChu());
        res.setCreatedAt(entity.getCreatedAt());

        if (entity.getThoiKhoaBieu() != null) {
            res.setThoiKhoaBieu(ThoiKhoaBieuResponse.fromEntity(entity.getThoiKhoaBieu()));
        }

        if (entity.getGiaoVienThay() != null) {
            ThoiKhoaBieuResponse.GiaoVienDto gvDto = new ThoiKhoaBieuResponse.GiaoVienDto();
            gvDto.setId(entity.getGiaoVienThay().getId());
            gvDto.setHoTen(entity.getGiaoVienThay().getHoTen());
            gvDto.setMaGiaoVien(entity.getGiaoVienThay().getMaGiaoVien());
            res.setGiaoVienThay(gvDto);
        }

        return res;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public ThoiKhoaBieuResponse getThoiKhoaBieu() {
        return thoiKhoaBieu;
    }

    public void setThoiKhoaBieu(ThoiKhoaBieuResponse thoiKhoaBieu) {
        this.thoiKhoaBieu = thoiKhoaBieu;
    }

    public ThoiKhoaBieuResponse.GiaoVienDto getGiaoVienThay() {
        return giaoVienThay;
    }

    public void setGiaoVienThay(ThoiKhoaBieuResponse.GiaoVienDto giaoVienThay) {
        this.giaoVienThay = giaoVienThay;
    }

    public LocalDate getNgay() {
        return ngay;
    }

    public void setNgay(LocalDate ngay) {
        this.ngay = ngay;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
