const User = require('./User');
const DoctorInfo = require('./DoctorInfo');
const Specialty = require('./Specialty');
const Appointment = require('./Appointment');
const MedicalRecord = require('./MedicalRecord');
User.hasOne(DoctorInfo, { foreignKey: 'userId' });
DoctorInfo.belongsTo(User, { foreignKey: 'userId' });

Specialty.hasMany(DoctorInfo, { foreignKey: 'specialtyId' });
DoctorInfo.belongsTo(Specialty, { foreignKey: 'specialtyId' });

Specialty.hasMany(Appointment, { foreignKey: 'specialtyId' });
Appointment.belongsTo(Specialty, { foreignKey: 'specialtyId' });

DoctorInfo.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(DoctorInfo, { foreignKey: 'doctorId' });

User.hasMany(Appointment, { foreignKey: 'userId' });
Appointment.belongsTo(User, { foreignKey: 'userId' });

Appointment.hasOne(MedicalRecord, { foreignKey: 'appointmentId' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId' });

DoctorInfo.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
MedicalRecord.belongsTo(DoctorInfo, { foreignKey: 'doctorId' });
