import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Search, 
  Plus, 
  Clock, 
  Trash2, 
  XCircle,
  Sparkles 
} from 'lucide-react';

function SpecialtyManager({ onUpdate }) {
  const [specialties, setSpecialties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchSpecialties = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/specialties');
      setSpecialties(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách chuyên khoa:", err);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const handleCreateSpecialty = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/specialties', formData);
      alert('✅ Tạo chuyên khoa thành công!');
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      fetchSpecialties();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Lỗi tạo chuyên khoa');
    }
  };

  const handleDeleteSpecialty = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa chuyên khoa này?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/specialties/${id}`);
      fetchSpecialties();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Không thể xóa chuyên khoa này');
    }
  };

  const filteredSpecialties = specialties.filter((sp) => 
    sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sp.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div className="section-header-flex" style={{ backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '20px', border: '1px solid #e6e6df' }}>
        <div>
          <h2 className="section-title-garamond" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={24} color="#5a5a40" /> Danh Sách Chuyên Khoa & Khung Dịch Vụ
          </h2>
          <p style={{ fontSize: '13px', color: '#8a8a70', margin: '4px 0 0 0' }}>
            Quản lý các khoa khám bệnh chuyên sâu và bảng giá dịch vụ
          </p>
        </div>

        <button className="btn-primary-natural" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Thêm Chuyên Khoa Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df' }}>
        <div className="header-search" style={{ width: '100%' }}>
          <Search size={16} color="#8a8a70" />
          <input 
            type="text" 
            placeholder="Tìm kiếm chuyên khoa theo tên hoặc mô tả..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Specialty Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredSpecialties.map((sp) => (
          <div key={sp.id} className="stat-card-natural" style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e6e6df' }}>
                  <Building2 size={20} color="#5a5a40" />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="brand-tag">KHOA-{sp.id}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2d2d2a', margin: '2px 0 0 0' }}>
                    {sp.name}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#8a8a70', marginTop: '12px', lineHeight: '1.5' }}>
                {sp.description || 'Chuyên khám và điều trị các bệnh lý lâm sàng chất lượng cao.'}
              </p>

              {/* Ô Khung Dịch Vụ (Giữ nguyên cấu trúc nhưng chờ dữ liệu thực) */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f5f5f0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5a5a40' }}>
                  <span style={{ color: '#8a8a70', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Thời lượng ca khám dự kiến:
                  </span>
                  <span style={{ fontWeight: '600' }}>{sp.durationMin ? `${sp.durationMin} phút` : 'Chưa cập nhật'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5a5a40' }}>
                  <span style={{ color: '#8a8a70' }}>Giá khám Tiêu chuẩn:</span>
                  <span style={{ fontWeight: '700', color: '#2d2d2a' }}>
                    {sp.standardFee ? `${Number(sp.standardFee).toLocaleString('vi-VN')} VNĐ` : 'Chưa cập nhật'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5a5a40' }}>
                  <span style={{ color: '#8a8a70', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   Giá khám VIP / Chuyên gia:
                  </span>
                  <span style={{ fontWeight: '700', color: '#5a5a40' }}>
                    {sp.vipFee ? `${Number(sp.vipFee).toLocaleString('vi-VN')} VNĐ` : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f5f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge-status active">Hoạt động</span>
              <button 
                onClick={() => handleDeleteSpecialty(sp.id)}
                style={{ background: 'none', border: 'none', color: '#b84343', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}
              >
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm Chuyên Khoa */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e6e6df' }}>
            <div style={{ backgroundColor: '#5a5a40', color: '#ffffff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Tạo Chuyên Khoa Mới</h3>
              <XCircle size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleCreateSpecialty} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Tên Chuyên Khoa *</label>
                <input 
                  type="text" required placeholder="Ví dụ: Khoa Tim Mạch"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Mô tả ngắn</label>
                <textarea 
                  rows={3} placeholder="Mô tả chức năng khám bệnh..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary-natural" onClick={() => setShowAddModal(false)}>Hủy Bỏ</button>
                <button type="submit" className="btn-primary-natural">Lưu Chuyên Khoa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecialtyManager;