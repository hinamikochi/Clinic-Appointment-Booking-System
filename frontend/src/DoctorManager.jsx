import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  Trash2, 
  XCircle,
  Edit,
  Save
} from 'lucide-react';

function DoctorManager({ onUpdate, initialSearchQuery }) {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    specialtyId: '',
    degree: 'Bác sĩ chuyên khoa',
    image: '',
    roomNumber: '',
    consultationFee: '',
    description: ''
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    full_name: '',
    specialtyId: '',
    degree: '',
    image: '',
    roomNumber: '',
    consultationFee: '',
    description: ''
  });

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const fetchData = async () => {
    try {
      const resDocs = await axios.get('http://localhost:5001/api/doctors');
      setDoctors(resDocs.data);

      const resSpecs = await axios.get('http://localhost:5001/api/specialties');
      setSpecialties(resSpecs.data);
      if (resSpecs.data.length > 0 && !formData.specialtyId) {
        setFormData(prev => ({ ...prev, specialtyId: resSpecs.data[0].id }));
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu bác sĩ:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal Chỉnh Sửa Bác Sĩ
  const handleOpenEditModal = (doc) => {
    setEditingDoctor(doc);
    setEditFormData({
      id: doc.id,
      full_name: doc.User?.full_name || '',
      specialtyId: doc.specialtyId || specialties[0]?.id || '',
      degree: doc.degree || '',
      image: doc.image || '',
      roomNumber: doc.roomNumber || '',
      consultationFee: doc.consultationFee || 200000,
      description: doc.description || ''
    });
  };

  // Lưu Thay Đổi Cập Nhật Bác Sĩ
  const handleUpdateDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5001/api/admin/doctors/${editFormData.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🎉 " + res.data.message);
      setEditingDoctor(null);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật bác sĩ");
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password || !formData.specialtyId) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/admin/doctors', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🎉 Tạo tài khoản Bác sĩ thành công!");
      setShowAddModal(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        specialtyId: specialties[0]?.id || '',
        degree: 'Bác sĩ chuyên khoa',
        image: '',
        roomNumber: '',
        consultationFee: '',
        description: ''
      });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi tạo bác sĩ");
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bác sĩ này khỏi hệ thống?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/admin/doctors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Đã xóa bác sĩ thành công!");
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa bác sĩ");
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.User?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.User?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpecialty === 'all' || String(doc.specialtyId) === String(selectedSpecialty);
    return matchesSearch && matchesSpec;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div className="section-header-flex" style={{ backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '20px', border: '1px solid #e6e6df' }}>
        <div>
          <h2 className="section-title-garamond" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope size={24} color="#5a5a40" /> Quản Lý Danh Sách Bác Sĩ
          </h2>
          <p style={{ fontSize: '13px', color: '#8a8a70', margin: '4px 0 0 0' }}>
            Tổng số: {doctors.length} bác sĩ trong cơ sở dữ liệu hệ thống
          </p>
        </div>

        <button className="btn-primary-natural" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Thêm Bác Sĩ Mới
        </button>
      </div>

      {/* Filter Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="header-search" style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e6e6df' }}>
          <Search size={16} color="#8a8a70" />
          <input 
            type="text" 
            placeholder="Tìm theo tên bác sĩ, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: '99px', border: '1px solid #e6e6df', backgroundColor: '#fdfbf7', fontSize: '13px', color: '#2d2d2a', outline: 'none' }}
        >
          <option value="all">-- Tất cả chuyên khoa --</option>
          {specialties.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Doctor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc) => (
            <div key={doc.id} className="stat-card-natural" style={{ flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e6e6df', backgroundColor: '#e2f0d9', color: '#2e6f40', fontWeight: '700', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {doc.image ? (
                      <img src={doc.image} alt={doc.User?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      doc.User?.full_name ? doc.User.full_name.charAt(0).toUpperCase() : 'B'
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <span className="brand-tag">{doc.Specialty?.name || 'Chuyên Khoa'}</span>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#2d2d2a', margin: '4px 0 2px 0' }}>
                      {doc.User?.full_name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#8a8a70' }}>{doc.degree}</div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f5f5f0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8a8a70' }}>Email:</span>
                    <span style={{ fontWeight: '500', color: '#2d2d2a' }}>{doc.User?.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8a8a70' }}>Số phòng khám:</span>
                    <span style={{ fontWeight: '700', color: '#5a5a40' }}>{doc.roomNumber || 'Phòng 101 - Tầng 1'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8a8a70' }}>Giá khám niêm yết:</span>
                    <span style={{ fontWeight: '700', color: '#2e6f40' }}>
                      {doc.consultationFee ? `${Number(doc.consultationFee).toLocaleString('vi-VN')} VNĐ` : '200.000 VNĐ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút sửa và xoá */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f5f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => handleOpenEditModal(doc)}
                  style={{ background: 'none', border: 'none', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                >
                  <Edit size={14} /> Chỉnh Sửa
                </button>
                <button 
                  onClick={() => handleDeleteDoctor(doc.id)}
                  style={{ background: 'none', border: 'none', color: '#b84343', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '36px', color: '#8a8a70', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e6e6df' }}>
            Không tìm thấy bác sĩ nào phù hợp với từ khóa "{searchQuery}"
          </div>
        )}
      </div>

      {/* Modal Thêm Bác Sĩ */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '460px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e6e6df' }}>
            <div style={{ backgroundColor: '#5a5a40', color: '#ffffff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Tạo Tài Khoản Bác Sĩ Mới</h3>
              <XCircle size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleCreateDoctor} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Họ và tên bác sĩ *</label>
                <input 
                  type="text" required placeholder="Ví dụ: Nguyễn Lân Việt"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Email *</label>
                  <input 
                    type="email" required placeholder="doctor@clinic.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Mật khẩu *</label>
                  <input 
                    type="password" required placeholder="******"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Chuyên khoa</label>
                  <select 
                    value={formData.specialtyId}
                    onChange={(e) => setFormData({...formData, specialtyId: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                  >
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Học vị</label>
                  <input 
                    type="text" value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a5a40' }}>Số phòng (Tự động/Tùy chỉnh)</label>
                  <input 
                    type="text" placeholder="Tự động cấp phòng trống"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcdcb8', marginTop: '4px', outline: 'none', backgroundColor: '#fdfbf7' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a5a40' }}>Giá khám (Tự động/Tùy chỉnh)</label>
                  <input 
                    type="number" placeholder="Mặc định theo khoa"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcdcb8', marginTop: '4px', outline: 'none', backgroundColor: '#fdfbf7' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Link Hình Ảnh Bác Sĩ (URL)</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary-natural" onClick={() => setShowAddModal(false)}>Hủy Bỏ</button>
                <button type="submit" className="btn-primary-natural">Lưu Bác Sĩ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Bác Sĩ */}
      {editingDoctor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '460px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e6e6df' }}>
            <div style={{ backgroundColor: '#5a5a40', color: '#ffffff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Sửa Thông Tin Bác Sĩ</h3>
              <XCircle size={20} style={{ cursor: 'pointer' }} onClick={() => setEditingDoctor(null)} />
            </div>

            <form onSubmit={handleUpdateDoctorSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Họ và tên bác sĩ *</label>
                <input 
                  type="text" required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Chuyên khoa</label>
                  <select 
                    value={editFormData.specialtyId}
                    onChange={(e) => setEditFormData({...editFormData, specialtyId: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                  >
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Học vị</label>
                  <input 
                    type="text" value={editFormData.degree}
                    onChange={(e) => setEditFormData({...editFormData, degree: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Điều chỉnh số phòng và giá khám */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a5a40' }}>Số phòng khám *</label>
                  <input 
                    type="text" required placeholder="Phòng 101 - Tầng 1"
                    value={editFormData.roomNumber}
                    onChange={(e) => setEditFormData({...editFormData, roomNumber: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcdcb8', marginTop: '4px', outline: 'none', backgroundColor: '#fdfbf7', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#2e6f40' }}>Giá khám niêm yết (VNĐ) *</label>
                  <input 
                    type="number" required step="10000" placeholder="200000"
                    value={editFormData.consultationFee}
                    onChange={(e) => setEditFormData({...editFormData, consultationFee: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cce8cc', marginTop: '4px', outline: 'none', backgroundColor: '#f4fbf4', fontWeight: '700', color: '#2e6f40' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Link Hình Ảnh Bác Sĩ (URL)</label>
                <input 
                  type="text" placeholder="https://..."
                  value={editFormData.image}
                  onChange={(e) => setEditFormData({...editFormData, image: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary-natural" onClick={() => setEditingDoctor(null)}>Hủy Bỏ</button>
                <button type="submit" className="btn-primary-natural" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Save size={16} /> Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorManager;