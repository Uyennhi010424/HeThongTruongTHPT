package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "chi_tiet_to_hop", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"to_hop_id", "mon_hoc_id"})
})
public class ChiTietToHop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_hop_id")
    private ToHopMon toHopMon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mon_hoc_id")
    private MonHoc monHoc;

    @Column(name = "so_tiet")
    private Integer soTiet;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public ToHopMon getToHopMon() { return toHopMon; }
    public void setToHopMon(ToHopMon toHopMon) { this.toHopMon = toHopMon; }
    public MonHoc getMonHoc() { return monHoc; }
    public void setMonHoc(MonHoc monHoc) { this.monHoc = monHoc; }
    public Integer getSoTiet() { return soTiet; }
    public void setSoTiet(Integer soTiet) { this.soTiet = soTiet; }
}
