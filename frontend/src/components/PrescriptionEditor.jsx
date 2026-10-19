export default function PrescriptionEditor({ items, onChange }) {
  const fields = [['name', 'Tên thuốc'], ['dosage', 'Liều lượng'], ['frequency', 'Số lần dùng'], ['duration', 'Thời gian dùng'], ['instructions', 'Hướng dẫn']];
  return <fieldset style={{ border: '1px solid #e6e6df', borderRadius: 12, padding: 12 }}>
    <legend>Thuốc kê theo từng dòng</legend>
    {items.map((item, index) => <div key={index} className="clinic-prescription-row">
      {fields.map(([field, label]) => <label key={field}>{label}<input className="clinic-input" required={field !== 'instructions'} value={item[field]} onChange={e => onChange(items.map((row, i) => i === index ? { ...row, [field]: e.target.value } : row))} /></label>)}
      <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))}>Xóa thuốc</button>
    </div>)}
    <button type="button" className="btn-secondary-natural" onClick={() => onChange([...items, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])}>Thêm thuốc</button>
  </fieldset>;
}
