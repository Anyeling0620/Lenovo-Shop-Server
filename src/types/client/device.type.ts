export type DeviceType = 'web' | 'mobile_web';

export interface DeviceInfo {
    device_id: string;
    device_type: DeviceType;
    device_name?: string;
    login_time: string;
    ip_address?: string;
}