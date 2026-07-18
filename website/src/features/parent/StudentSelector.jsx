/**
 * Dropdown chọn học sinh cho phụ huynh có nhiều con.
 * Hiển thị tên học sinh + lớp.
 */
export default function StudentSelector({ students, selectedIndex, onSelect }) {
  if (!students || students.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2">
      <span className="text-sm font-medium text-on-surface-variant">Chọn con:</span>
      <select
        className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-1.5 text-sm text-on-surface focus:border-primary focus:outline-none"
        value={selectedIndex}
        onChange={(event) => onSelect(Number(event.target.value))}
      >
        {students.map((student, index) => (
          <option key={student.id} value={index}>
            {student.hoTen} — {student.lop?.tenLop || "Chưa xếp lớp"}
          </option>
        ))}
      </select>
    </div>
  );
}
