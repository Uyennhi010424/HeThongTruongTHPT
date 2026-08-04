package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.BaiKiemTra;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.repository.BaiKiemTraRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BaiKiemTraScheduler {

    private final BaiKiemTraRepository baiKiemTraRepository;
    private final ThongBaoService thongBaoService;

    public BaiKiemTraScheduler(BaiKiemTraRepository baiKiemTraRepository, ThongBaoService thongBaoService) {
        this.baiKiemTraRepository = baiKiemTraRepository;
        this.thongBaoService = thongBaoService;
    }

    // Chạy mỗi phút 1 lần
    @Scheduled(cron = "0 * * * * *")
    public void thongBaoBaiKiemTraSapDienRa() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in10Minutes = now.plusMinutes(10);
        
        // Tìm các bài kiểm tra sẽ bắt đầu từ (now) đến (now + 10 phút) và chưa thông báo
        List<BaiKiemTra> exams = baiKiemTraRepository.findByThoiGianBatDauBetweenAndDaThongBaoFalse(now, in10Minutes);
        
        for (BaiKiemTra exam : exams) {
            // Tạo thông báo
            ThongBao tb = new ThongBao();
            tb.setTieuDe("Sắp diễn ra bài kiểm tra: " + exam.getTieuDe());
            tb.setNoiDung("Bài kiểm tra môn " + exam.getMonHoc().getTenMon() + " sẽ bắt đầu vào lúc " + exam.getThoiGianBatDau().toString() + ". Hãy chuẩn bị sẵn sàng!");
            tb.setLoai("HOC_SINH");
            tb.setLop(exam.getLopHoc());
            tb.setNgayDang(now);
            tb.setTrangThai(1);
            tb.setSenderRole("SYSTEM");
            
            // Gửi thông báo
            thongBaoService.create(tb);
            
            // Đánh dấu đã thông báo
            exam.setDaThongBao(true);
            baiKiemTraRepository.save(exam);
            System.out.println("Đã gửi thông báo nhắc nhở bài kiểm tra: " + exam.getId());
        }
    }
}
