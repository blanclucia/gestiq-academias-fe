import { GraduationCap, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAppBrand } from '@/theme/AppBrandContext'

const demoCredentials = {
    email: 'admin@academiapuentes.com',
    password: 'demo123',
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
    const { config } = useAppBrand()
    const [email, setEmail] = useState(demoCredentials.email)
    const [password, setPassword] = useState(demoCredentials.password)
    const [error, setError] = useState('')

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (email.trim().toLowerCase() !== demoCredentials.email || password !== demoCredentials.password) {
            setError('El email o la contraseña no coinciden con el acceso demo.')
            return
        }
        onLogin()
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand"><span><GraduationCap size={23} /></span><div><strong>Academia Puentes</strong><small>Gestión académica</small></div></div>
                <div className="login-heading"><p>Tu espacio académico</p><h1>Ingresá a tu academia</h1><span>Accedé a las herramientas y actividades disponibles para tu perfil.</span></div>
                <form className="login-form" onSubmit={submit}>
                    <label><span>Email</span><div><Mail size={16} /><input type="email" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} required /></div></label>
                    <label><span>Contraseña</span><div><LockKeyhole size={16} /><input type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} required /></div></label>
                    {error && <p className="form-error-message" role="alert">{error}</p>}
                    <button type="submit" className="primary-button">Ingresar</button>
                </form>
                <div className="login-demo-note"><strong>Acceso de demostración</strong><span>{demoCredentials.email}</span><span>Contraseña: {demoCredentials.password}</span></div>
                <div className="login-platform-link">
                    <span>Plataforma desarrollada por</span>
                    <a href={config.websiteUrl} target="_blank" rel="noreferrer">{config.platformName} →</a>
                </div>
            </section>
        </main>
    )
}
