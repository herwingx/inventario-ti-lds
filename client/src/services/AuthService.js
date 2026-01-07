import api from './api'

class AuthService {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  }

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
  }
}

export default new AuthService()
