import {
    CalendarDays,
    CheckCircle2,
    Copy,
    Clock3,
    GraduationCap,
    Users,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
    createPublicRegistration,
    getPublicEnrollmentAvailability,
    getPublicEnrollmentOffer,
    type PublicRegistration,
} from "@/services/academyRepository";
import { getAcademySettings } from "@/services/academySettingsRepository";
import { calculateAge } from "@/domain/students/studentRules";

export function PublicEnrollmentPage() {
    const { slug } = useParams();
    const offer = slug ? getPublicEnrollmentOffer(slug) : null;
    const settings = getAcademySettings();
    const [selectedCommissionId, setSelectedCommissionId] = useState("");
    const [commissionConfirmed, setCommissionConfirmed] = useState(false);
    const availability = slug
        ? getPublicEnrollmentAvailability(slug, selectedCommissionId || undefined)
        : { available: false, reason: "Este link no existe o ya no está vigente." };
    const selectedCommission = offer?.commissions.find(
        (commission) => commission.id === selectedCommissionId,
    );
    const [registration, setRegistration] = useState<PublicRegistration | null>(
        null,
    );
    const [paymentOption, setPaymentOption] = useState<
        "mercadopago" | "transferencia" | "efectivo" | null
    >(null);
    const [copyFeedback, setCopyFeedback] = useState("");
    const [formError, setFormError] = useState("");
    const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        document: "",
        email: "",
        phone: "",
        birthDate: "",
        address: "",
        tutorName: "",
        tutorEmail: "",
        tutorPhone: "",
        priorStudies: "",
    });

    if (
        !offer ||
        (!availability.available && !registration && !selectedCommissionId)
    )
        return (
            <main className="public-enrollment-page">
                <div className="public-enrollment-card">
                    <h1>Inscripción no disponible</h1>
                    <p>{availability.reason}</p>
                </div>
            </main>
        );

    const registrationCommission = registration
        ? offer.commissions.find(
            (commission) => commission.id === registration.commissionId,
        )
        : selectedCommission;
    const update = (key: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
        setFormError("");
    };
    const copyPaymentValue = async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopyFeedback(`${label} copiado`);
            window.setTimeout(() => setCopyFeedback(""), 1800);
        } catch {
            setCopyFeedback(`No se pudo copiar ${label.toLowerCase()}`);
        }
    };
    const requiredFields = new Set(settings.enrollments.requiredFields);
    const age = form.birthDate ? calculateAge(form.birthDate) : null;
    const isMinor = age !== null && age < 18;
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedCommission || !availability.available) {
            setFormError(availability.reason || "Elegí una comisión para continuar.");
            return;
        }
        if (
            isMinor &&
            (!form.tutorName.trim() ||
                !form.tutorEmail.trim() ||
                !form.tutorPhone.trim())
        ) {
            setFormError("Completá los datos de contacto del tutor para continuar.");
            return;
        }
        const confirmed =
            settings.enrollments.confirmationMode === "Automática" &&
            !settings.enrollments.requirePayment;
        setRegistration(
            createPublicRegistration({
                ...form,
                fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
                offerSlug: offer.slug,
                openingId: offer.openingId,
                commissionId: selectedCommission.id,
                confirmed,
            }),
        );
    };

    const goToContactStep = () => {
        const missingFields = [
            !form.firstName.trim() ? "nombre del alumno" : "",
            !form.lastName.trim() ? "apellido del alumno" : "",
            requiredFields.has("Documento") && !form.document.trim() ? "documento" : "",
            requiredFields.has("Fecha de nacimiento") && !form.birthDate ? "fecha de nacimiento" : "",
        ].filter(Boolean);
        if (missingFields.length > 0) {
            setFormError(`Completá: ${missingFields.join(", ")}.`);
            return;
        }
        setFormError("");
        setFormStep(2);
    };

    const goToContactValidationStep = () => {
        if (isMinor && (!form.tutorName.trim() || (requiredFields.has("Email") && !form.tutorEmail.trim()) || (requiredFields.has("Teléfono") && !form.tutorPhone.trim()))) {
            setFormError("Completá los datos de contacto del tutor para continuar.");
            return;
        }
        if (!isMinor && ((requiredFields.has("Email") && !form.email.trim()) || (requiredFields.has("Teléfono") && !form.phone.trim()))) {
            setFormError("Completá los datos de contacto para continuar.");
            return;
        }
        setFormError("");
        setFormStep(3);
    };

    return (
        <main className="public-enrollment-page">
            <section className="public-enrollment-card">
                <div className="public-enrollment-brand">
                    {settings.brand.logoDataUrl ? (
                        <img
                            src={settings.brand.logoDataUrl}
                            alt={`Logo de ${settings.general.commercialName}`}
                        />
                    ) : (
                        <GraduationCap size={22} />
                    )}
                    <span>{settings.general.commercialName}</span>
                </div>
                {!registration ? (
                    <>
                        <p className="public-enrollment-eyebrow">Inscripción online</p>
                        <h1>{offer.courseName}</h1>
                        {!commissionConfirmed && (
                            <p>
                                Elegí la comisión cuyos días y horarios mejor se adapten a vos.
                            </p>
                        )}
                        {!commissionConfirmed && (
                            <div
                                className="public-commission-picker"
                                role="radiogroup"
                                aria-label="Comisiones disponibles"
                            >
                                {offer.commissions.map((commission) => {
                                    const commissionAvailability =
                                        getPublicEnrollmentAvailability(offer.slug, commission.id);
                                    const selected = selectedCommissionId === commission.id;
                                    return (
                                        <button
                                            key={commission.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            disabled={!commissionAvailability.available}
                                            className={selected ? "selected" : ""}
                                            onClick={() => {
                                                setSelectedCommissionId(commission.id);
                                                setFormError("");
                                            }}
                                        >
                                            <span className="public-commission-radio" />
                                            <span className="public-commission-copy">
                                                <strong>{commission.name}</strong>
                                                <small>
                                                    <Clock3 size={14} />
                                                    {commission.schedule}
                                                </small>
                                                <small>
                                                    <CalendarDays size={14} />
                                                    Cursada:{" "}
                                                    {commission.startDate
                                                        .split("-")
                                                        .reverse()
                                                        .join("/")}{" "}
                                                    al {commission.endDate.split("-").reverse().join("/")}
                                                </small>
                                            </span>
                                            <span className="public-commission-capacity">
                                                <Users size={14} />
                                                {commissionAvailability.available
                                                    ? "Disponible"
                                                    : "Sin cupo"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedCommission && !commissionConfirmed && (
                            <div className="public-enrollment-selection-action">
                                <div className="public-enrollment-summary">
                                    <span>{selectedCommission.name}</span>
                                    <strong>
                                        ${offer.amount.toLocaleString("es-AR")} · inscripción
                                    </strong>
                                </div>
                                <button
                                    className="primary-button"
                                    type="button"
                                    onClick={() => setCommissionConfirmed(true)}
                                >
                                    Continuar
                                </button>
                            </div>
                        )}
                        {selectedCommission && commissionConfirmed && (
                            <div className="public-enrollment-summary public-enrollment-summary-compact">
                                <span>
                                    <strong>{offer.courseName}</strong>
                                    {selectedCommission.name}
                                </span>
                                <strong>
                                    ${offer.amount.toLocaleString("es-AR")} · inscripción
                                </strong>
                            </div>
                        )}
                        {commissionConfirmed && (
                            <form onSubmit={submit} className="public-enrollment-form">
                                <div
                                    className="public-enrollment-progress"
                                    aria-label="Progreso de inscripción"
                                >
                                    <button
                                        type="button"
                                        className={
                                            formStep === 1 ? "active" : formStep > 1 ? "complete" : ""
                                        }
                                        onClick={() => formStep > 1 && setFormStep(1)}
                                        disabled={formStep === 1}
                                    >
                                        1 Alumno
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            formStep === 2 ? "active" : formStep > 2 ? "complete" : ""
                                        }
                                        onClick={() => formStep > 2 && setFormStep(2)}
                                        disabled={formStep <= 2}
                                    >
                                        2 Contacto
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            formStep === 3 ? "active" : formStep > 3 ? "complete" : ""
                                        }
                                        onClick={() => formStep > 3 && setFormStep(3)}
                                        disabled={formStep <= 3}
                                    >
                                        3 Pago
                                    </button>
                                </div>
                                {formError && <p className="form-error-message">{formError}</p>}
                                {formStep === 1 && (
                                    <>
                                        <div className="public-enrollment-section-heading">
                                            <strong>Datos del alumno</strong>
                                            <span>
                                                Completá la información de la persona que va a cursar.
                                            </span>
                                        </div>
                                        <div className="public-enrollment-name-fields">
                                            <label className="public-enrollment-field">
                                                Nombre del alumno *
                                                <input
                                                    required
                                                    value={form.firstName}
                                                    onChange={(event) =>
                                                        update("firstName", event.target.value)
                                                    }
                                                    placeholder="Ej. Lucía"
                                                />
                                            </label>
                                            <label className="public-enrollment-field">
                                                Apellido del alumno *
                                                <input
                                                    required
                                                    value={form.lastName}
                                                    onChange={(event) =>
                                                        update("lastName", event.target.value)
                                                    }
                                                    placeholder="Ej. Gómez"
                                                />
                                            </label>
                                        </div>
                                        <label className="public-enrollment-field">
                                            DNI{requiredFields.has("Documento") ? " *" : ""}
                                            <input
                                                required={requiredFields.has("Documento")}
                                                value={form.document}
                                                onChange={(event) =>
                                                    update("document", event.target.value)
                                                }
                                                placeholder="Ej. 32.108.901"
                                            />
                                        </label>
                                        <label className="public-enrollment-field">
                                            Fecha de nacimiento
                                            {requiredFields.has("Fecha de nacimiento") ? " *" : ""}
                                            <input
                                                required={requiredFields.has("Fecha de nacimiento")}
                                                type="date"
                                                value={form.birthDate}
                                                onChange={(event) =>
                                                    update("birthDate", event.target.value)
                                                }
                                            />
                                        </label>
                                        <div className="public-enrollment-step-actions">
                                            <button
                                                className="secondary-button"
                                                type="button"
                                                onClick={() => setCommissionConfirmed(false)}
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                className="primary-button"
                                                type="button"
                                                onClick={goToContactStep}
                                            >
                                                Continuar
                                            </button>
                                        </div>
                                    </>
                                )}
                                {formStep === 2 && (
                                    <>
                                        <div className="public-enrollment-section-heading">
                                            <strong>Contacto y estudios previos</strong>
                                            <span>
                                                {isMinor
                                                    ? "Los datos principales de contacto corresponden al tutor."
                                                    : "Indicá cómo podemos contactar al alumno."}
                                            </span>
                                        </div>
                                        {isMinor && (
                                            <div className="public-enrollment-guardian-section">
                                                <label className="public-enrollment-field">
                                                    Nombre y apellido del tutor *
                                                    <input
                                                        required
                                                        value={form.tutorName}
                                                        onChange={(event) =>
                                                            update("tutorName", event.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className="public-enrollment-field">
                                                    Email del tutor
                                                    {requiredFields.has("Email") ? " *" : ""}
                                                    <input
                                                        required={requiredFields.has("Email")}
                                                        type="email"
                                                        value={form.tutorEmail}
                                                        onChange={(event) =>
                                                            update("tutorEmail", event.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className="public-enrollment-field">
                                                    Teléfono del tutor
                                                    {requiredFields.has("Teléfono") ? " *" : ""}
                                                    <input
                                                        required={requiredFields.has("Teléfono")}
                                                        value={form.tutorPhone}
                                                        onChange={(event) =>
                                                            update("tutorPhone", event.target.value)
                                                        }
                                                    />
                                                </label>
                                            </div>
                                        )}
                                        <label className="public-enrollment-field">
                                            {isMinor
                                                ? "Email del alumno (opcional)"
                                                : `Email de contacto${requiredFields.has("Email") ? " *" : ""}`}
                                            <input
                                                required={!isMinor && requiredFields.has("Email")}
                                                type="email"
                                                value={form.email}
                                                onChange={(event) =>
                                                    update("email", event.target.value)
                                                }
                                                placeholder="lucia@email.com"
                                            />
                                        </label>
                                        <label className="public-enrollment-field">
                                            {isMinor
                                                ? "Teléfono del alumno (opcional)"
                                                : `Teléfono de contacto${requiredFields.has("Teléfono") ? " *" : ""}`}
                                            <input
                                                required={!isMinor && requiredFields.has("Teléfono")}
                                                value={form.phone}
                                                onChange={(event) =>
                                                    update("phone", event.target.value)
                                                }
                                                placeholder="+54 11 1234-5678"
                                            />
                                        </label>
                                        {requiredFields.has("Dirección") && (
                                            <label className="public-enrollment-field">
                                                Dirección *
                                                <input
                                                    required
                                                    value={form.address}
                                                    onChange={(event) =>
                                                        update("address", event.target.value)
                                                    }
                                                    placeholder="Ej. Av. San Martín 1240"
                                                />
                                            </label>
                                        )}
                                        <label className="public-enrollment-field">
                                            Estudios previos (opcional)
                                            <textarea
                                                value={form.priorStudies}
                                                onChange={(event) =>
                                                    update("priorStudies", event.target.value)
                                                }
                                                placeholder="Contanos brevemente qué estudió o qué experiencia tiene."
                                                rows={3}
                                            />
                                        </label>
                                        <div className="public-enrollment-step-actions">
                                            <button
                                                className="secondary-button"
                                                type="button"
                                                onClick={() => setFormStep(1)}
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                className="primary-button"
                                                type="button"
                                                onClick={goToContactValidationStep}
                                            >
                                                Continuar
                                            </button>
                                        </div>
                                    </>
                                )}
                                {formStep === 3 && (
                                    <>
                                        <div className="public-enrollment-section-heading">
                                            <strong>Elegí el método de pago</strong>
                                            <span>Seleccioná cómo querés abonar la inscripción.</span>
                                        </div>
                                        <div className="payment-method-options">
                                            <button
                                                className={
                                                    paymentOption === "mercadopago"
                                                        ? "payment-method-option selected"
                                                        : "payment-method-option"
                                                }
                                                type="button"
                                                onClick={() => {
                                                    setPaymentOption("mercadopago");
                                                    setFormError("");
                                                }}
                                            >
                                                <strong>Mercado Pago</strong>
                                                <small>Pagá online con tu tarjeta o saldo.</small>
                                                {paymentOption === "mercadopago" && (
                                                    <span className="payment-method-inline-details">
                                                        <strong>Link de pago</strong>
                                                        <a href={settings.payments.paymentLink} target="_blank" rel="noreferrer">{settings.payments.paymentLink}</a>
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                className={
                                                    paymentOption === "transferencia"
                                                        ? "payment-method-option selected"
                                                        : "payment-method-option"
                                                }
                                                type="button"
                                                onClick={() => {
                                                    setPaymentOption("transferencia");
                                                    setFormError("");
                                                }}
                                            >
                                                <strong>Transferencia bancaria</strong>
                                                <small>
                                                    Usá los datos de la academia para transferir.
                                                </small>
                                                {paymentOption === "transferencia" && (
                                                    <span className="payment-method-inline-details">
                                                        <strong>Datos para transferir</strong>
                                                        <span>Alias: {settings.payments.transferAlias || "Sin configurar"}</span>
                                                        <span>CBU / CVU: {settings.payments.transferCbu || "Sin configurar"}</span>
                                                        <span>Titular: {settings.payments.accountHolder} · CUIT {settings.payments.accountTaxId}</span>
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                className={paymentOption === "efectivo" ? "payment-method-option selected" : "payment-method-option"}
                                                type="button"
                                                onClick={() => { setPaymentOption("efectivo"); setFormError("") }}
                                            >
                                                <strong>Efectivo en sede</strong>
                                                <small>Aboná personalmente en la academia.</small>
                                                {paymentOption === "efectivo" && (
                                                    <span className="payment-method-inline-details">
                                                        <strong>Dirección de la sede</strong>
                                                        <span>{settings.general.address || "Dirección no configurada"}</span>
                                                        <span>Indicá el nombre del alumno y presentá su DNI.</span>
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                        <div className="public-enrollment-step-actions">
                                            <button
                                                className="secondary-button"
                                                type="button"
                                                onClick={() => setFormStep(2)}
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                className="primary-button"
                                                type="button"
                                                onClick={submit}
                                            >
                                                Confirmar inscripción
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        )}
                    </>
                ) : (
                    <div className="public-enrollment-success">
                        <CheckCircle2 size={40} />
                        <h1>Inscripción registrada</h1>
                        <p>
                            {registration.fullName} quedó inscripto/a en {offer.courseName} · {registrationCommission?.name}.
                        </p>
                        {paymentOption === "mercadopago" && <><p>Completá el pago para confirmar tu vacante.</p><a className="mercadopago-button" href={settings.payments.paymentLink} target="_blank" rel="noreferrer">Abrir link de pago</a></>}
                        {paymentOption === "transferencia" && <><p>Realizá la transferencia con estos datos y aguardá la verificación.</p><div className="transfer-details public-final-transfer-details"><div><dt>Alias</dt><dd>{settings.payments.transferAlias || "Sin configurar"}<button type="button" aria-label="Copiar alias" onClick={() => void copyPaymentValue("Alias", settings.payments.transferAlias)}><Copy size={14} /></button></dd></div><div><dt>CBU / CVU</dt><dd>{settings.payments.transferCbu || "Sin configurar"}<button type="button" aria-label="Copiar CBU o CVU" onClick={() => void copyPaymentValue("CBU / CVU", settings.payments.transferCbu)}><Copy size={14} /></button></dd></div><div><dt>Titular</dt><dd>{settings.payments.accountHolder}</dd></div><div><dt>CUIT</dt><dd>{settings.payments.accountTaxId}</dd></div></div>{copyFeedback && <small className="payment-copy-feedback">{copyFeedback}</small>}</>}
                        {paymentOption === "efectivo" && <p>Quedó pendiente de pago en sede. Acercate a {settings.general.address || "la sede"} para completar el pago.</p>}
                    </div>
                )}
            </section>
        </main>
    );
}
