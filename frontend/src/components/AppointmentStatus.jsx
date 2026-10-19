import { statusLabels } from '../utils/appointmentStatus';
export default function AppointmentStatus({ status }) { return <span className={`badge-status status-${status}`}>{statusLabels[status] || status}</span>; }
