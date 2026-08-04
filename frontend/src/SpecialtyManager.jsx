import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SpecialtyManager({ onUpdate }) {
    const [specialties, setSpecialties] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchSpecialties();
    }, []);

    const fetchSpecialties = async () => {
        try {
        const res = await axios.get('http://localhost:5001/api/specialties');
        setSpecialties(res.data);
        } catch (error) {
        console.error('Lỗi khi lấy danh sách', error);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/specialties', { name, description });
            alert('Chuyên khoa mới đã được tạo!');
            setName('');
            setDescription('');
            await fetchSpecialties();
            if(onUpdate) onUpdate(); 
        } catch (error) {
            console.error(error);
            alert('Lỗi tạo chuyên khoa mới.');
        }
    };

    return (
    <div style={{ marginTop: '30px', textAlign: 'left', background: '#fff', padding: '20px', borderRadius: '10px', color: '#333' }}>
      <h3 style={{ color: '#1976d2', borderBottom: '2px solid #e3f2fd', paddingBottom: '10px' }}>
        + Quản lý Chuyên khoa
      </h3>
      
      {/* Form nhập liệu */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <input 
          type="text" placeholder="Tên chuyên khoa (VD: Khoa Nhi)" 
          value={name} onChange={e => setName(e.target.value)} required 
          style={{ padding: '10px', flex: 1, border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <input 
          type="text" placeholder="Mô tả ngắn" 
          value={description} onChange={e => setDescription(e.target.value)} 
          style={{ padding: '10px', flex: 2, border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <button type="submit" className="register-btn" style={{ width: '120px', margin: 0 }}>
          Thêm mới
        </button>
      </form>

      {/* Bảng hiển thị */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th style={{ padding: '10px' }}>Tên chuyên khoa</th>
            <th style={{ padding: '10px' }}>Mô tả</th>
          </tr>
        </thead>
        <tbody>
          {specialties.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{item.id}</td>
              <td style={{ padding: '10px' }}><strong>{item.name}</strong></td>
              <td style={{ padding: '10px', color: '#666' }}>{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

            
export default SpecialtyManager;                
 