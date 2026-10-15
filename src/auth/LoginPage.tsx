import { GraduationCap, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { PlatformCredit } from '@/components/layout/PlatformCredit'
import { useAuth } from './AuthContext'
import { authErrorMessage } from './authErrors'
import { loginSchema, passwordSchema } from './loginValidation'

export function LoginPage() {
    const { client, phase, logoutMessage } = useAuth()
    const [message, setMessage] = useState('')
    return <main className="login-page"><section className="login-card">
        <div className="login-brand"><span><GraduationCap size={23} /></span><div><strong>GestIQ - Academias</strong></div></div>
        {phase === 'password-change' ? <PasswordForm onChanged={() => setMessage('Contraseña actualizada. Ingresá con tu DNI y la nueva clave.')} /> : <>
            <div className="login-heading"><p>Tu espacio académico</p><h1>Ingresá a tu academia</h1><span>Usá tu DNI y tu contraseña para continuar.</span></div>
            {message && <p role="status">{message}</p>}
            {logoutMessage && <p role="status">{logoutMessage}</p>}
            <LoginForm />
        </>}
        <PlatformCredit />
        {phase === 'password-change' && <button className="secondary-button" onClick={() => client.clear()}>Volver al ingreso</button>}
    </section></main>
}

function LoginForm() {
    const { client } = useAuth()
    const { register, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm<{ dni: string; password: string }>()
    const submit = handleSubmit(async (values) => {
        const parsed = loginSchema.safeParse(values)
        if (!parsed.success) { parsed.error.issues.forEach((issue) => setError(issue.path[0] as 'dni' | 'password', { message: issue.message })); return }
        try { await client.login(parsed.data) }
        catch (error) { setError('root', { message: authErrorMessage(error) }) }
        finally { resetField('password') }
    })
    return <form className="login-form" onSubmit={submit} noValidate>
        <label><span>DNI</span><div><UserRound size={16} /><input {...register('dni')} inputMode="numeric" autoComplete="username" aria-invalid={!!errors.dni} aria-describedby={errors.dni ? 'dni-error' : undefined} autoFocus /></div></label>
        {errors.dni && <p id="dni-error" className="form-error-message" role="alert">{errors.dni.message}</p>}
        <label><span>Contraseña</span><div><LockKeyhole size={16} /><input {...register('password')} type="password" autoComplete="current-password" aria-invalid={!!errors.password} /></div></label>
        {errors.password && <p className="form-error-message" role="alert">{errors.password.message}</p>}
        {errors.root && <p className="form-error-message" role="alert">{errors.root.message}</p>}
        <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>
    </form>
}

function PasswordForm({ onChanged }: { onChanged: () => void }) {
    const { client } = useAuth()
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<{ newPassword: string; confirmation: string }>()
    const submit = handleSubmit(async (values) => {
        const parsed = passwordSchema.safeParse(values)
        if (!parsed.success) { parsed.error.issues.forEach((issue) => setError(issue.path[0] as 'newPassword' | 'confirmation', { message: issue.message })); return }
        try { await client.changeInitialPassword(parsed.data.newPassword); onChanged() }
        catch (error) { setError('root', { message: authErrorMessage(error) }) }
    })
    return <><div className="login-heading"><p>Primer acceso</p><h1>Elegí tu nueva contraseña</h1><span>Elegí una frase de 12 caracteres o más. Podés usar letras, números, espacios y símbolos; no es obligatorio combinarlos.</span></div>
        <form className="login-form" onSubmit={submit} noValidate>
            <label><span>Nueva contraseña</span><div><LockKeyhole size={16} /><input {...register('newPassword')} type="password" autoComplete="new-password" autoFocus aria-invalid={!!errors.newPassword} /></div></label>
            {errors.newPassword && <p className="form-error-message" role="alert">{errors.newPassword.message}</p>}
            <label><span>Confirmar contraseña</span><div><LockKeyhole size={16} /><input {...register('confirmation')} type="password" autoComplete="new-password" aria-invalid={!!errors.confirmation} /></div></label>
            {errors.confirmation && <p className="form-error-message" role="alert">{errors.confirmation.message}</p>}
            {errors.root && <p className="form-error-message" role="alert">{errors.root.message}</p>}
            <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar contraseña'}</button>
        </form></>
}
