import { useState, useCallback, useEffect } from 'react';
import { VALIDATION } from '../config';

const useForm = (initialValues = {}, validationSchema = {}, onSubmit) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Reset form to initial values
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
        setIsDirty(false);
    }, [initialValues]);

    // Set form values
    const setFormValues = useCallback((newValues) => {
        setValues(newValues);
        setIsDirty(true);
    }, []);

    // Handle field change
    const handleChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        setValues(prev => ({
            ...prev,
            [name]: fieldValue
        }));
        setIsDirty(true);

        // Clear field error when value changes
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    }, [errors]);

    // Handle field blur
    const handleBlur = useCallback((event) => {
        const { name } = event.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    }, []);

    // Validate a single field
    const validateField = useCallback((name, value) => {
        const fieldValidation = validationSchema[name];
        if (!fieldValidation) return undefined;

        // Required field validation
        if (fieldValidation.required && !value) {
            return fieldValidation.required === true
                ? `${name} is required`
                : fieldValidation.required;
        }

        // Pattern validation
        if (fieldValidation.pattern && value) {
            const pattern = typeof fieldValidation.pattern === 'string'
                ? VALIDATION[fieldValidation.pattern]
                : fieldValidation.pattern;

            if (!pattern.test(value)) {
                return fieldValidation.message || `Invalid ${name} format`;
            }
        }

        // Min length validation
        if (fieldValidation.minLength && value?.length < fieldValidation.minLength) {
            return `${name} must be at least ${fieldValidation.minLength} characters`;
        }

        // Max length validation
        if (fieldValidation.maxLength && value?.length > fieldValidation.maxLength) {
            return `${name} must be at most ${fieldValidation.maxLength} characters`;
        }

        // Min value validation
        if (fieldValidation.min && Number(value) < fieldValidation.min) {
            return `${name} must be at least ${fieldValidation.min}`;
        }

        // Max value validation
        if (fieldValidation.max && Number(value) > fieldValidation.max) {
            return `${name} must be at most ${fieldValidation.max}`;
        }

        // Custom validation
        if (fieldValidation.validate) {
            return fieldValidation.validate(value, values);
        }

        return undefined;
    }, [validationSchema, values]);

    // Validate all fields
    const validateForm = useCallback(() => {
        const newErrors = {};
        let isFormValid = true;

        Object.keys(validationSchema).forEach(fieldName => {
            const error = validateField(fieldName, values[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
                isFormValid = false;
            }
        });

        setErrors(newErrors);
        setIsValid(isFormValid);
        return isFormValid;
    }, [validateField, validationSchema, values]);

    // Handle form submission
    const handleSubmit = useCallback(async (event) => {
        if (event) {
            event.preventDefault();
        }

        setIsSubmitting(true);
        const isFormValid = validateForm();

        if (isFormValid && onSubmit) {
            try {
                await onSubmit(values);
            } catch (error) {
                setErrors(prev => ({
                    ...prev,
                    submit: error.message
                }));
            }
        }

        setIsSubmitting(false);
    }, [validateForm, values, onSubmit]);

    // Validate form when values change
    useEffect(() => {
        if (isDirty) {
            validateForm();
        }
    }, [values, isDirty, validateForm]);

    // Get field props
    const getFieldProps = useCallback((name) => ({
        name,
        value: values[name] || '',
        onChange: handleChange,
        onBlur: handleBlur,
        error: touched[name] && !!errors[name],
        helperText: touched[name] && errors[name]
    }), [values, handleChange, handleBlur, touched, errors]);

    // Set field value programmatically
    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
        setIsDirty(true);
    }, []);

    // Set field error programmatically
    const setFieldError = useCallback((name, error) => {
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, []);

    // Set field touched programmatically
    const setFieldTouched = useCallback((name, isTouched = true) => {
        setTouched(prev => ({
            ...prev,
            [name]: isTouched
        }));
    }, []);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        isDirty,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setFormValues,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        getFieldProps,
        validateField,
        validateForm
    };
};

export default useForm; 