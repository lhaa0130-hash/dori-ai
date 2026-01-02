import { NextRequest, NextResponse } from 'next/server';

// IP 주소 추출 함수
function getClientIP(request: NextRequest): string {
  // Vercel이나 프록시 환경에서 실제 IP 추출
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // 로컬 개발 환경
  return request.ip || '127.0.0.1';
}

// IP 기반 지역 정보 가져오기 (무료 API 사용)
async function getLocationFromIP(ip: string) {
  // 로컬 IP는 스킵
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: '로컬',
      region: '로컬',
      city: '로컬',
      timezone: 'Asia/Seoul'
    };
  }

  try {
    // ip-api.com 무료 서비스 사용 (45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone,query`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || '알 수 없음',
        region: data.regionName || '알 수 없음',
        city: data.city || '알 수 없음',
        timezone: data.timezone || 'Asia/Seoul',
        ip: data.query || ip
      };
    }
    
    return {
      country: '알 수 없음',
      region: '알 수 없음',
      city: '알 수 없음',
      timezone: 'Asia/Seoul',
      ip: ip
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      country: '알 수 없음',
      region: '알 수 없음',
      city: '알 수 없음',
      timezone: 'Asia/Seoul',
      ip: ip
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const location = await getLocationFromIP(ip);
    
    return NextResponse.json({
      ip: location.ip || ip,
      country: location.country,
      region: location.region,
      city: location.city,
      timezone: location.timezone,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in visitor info API:', error);
    return NextResponse.json(
      { error: 'Failed to get visitor info' },
      { status: 500 }
    );
  }
}

