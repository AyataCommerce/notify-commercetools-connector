import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useAsyncDispatch } from '@commercetools-frontend/sdk';
import React, { useEffect, useState } from 'react';
import { decryptString, encryptString, isPhoneNumberValid, validateEmail } from '../../../helpers';
import { updateSenderId } from '../../../hooks/channel/updateChannel.hooks';
import { ChannelInterfaceResponse } from '../../../interfaces/channel.interface';
import { fetchCustomObjectRepository } from '../../../repository/customObject.repository';
import styles from './ChannelSettings.module.css';

interface ChannelSettingsProps {
    channel: string;
}



const ChannelSettings = ({ channel }: ChannelSettingsProps) => {
    const [senderId, setSenderId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const dispatch = useAsyncDispatch();
    const cypherKey = useApplicationContext((context) =>
        context.environment as Record<string, any>
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: ChannelInterfaceResponse = await fetchCustomObjectRepository(
                    dispatch,
                    'notify-channels',
                    'notify-channels-key',
                );

                if (response.value[channel].configurations.sender_id) {
                    const encryptedSenderId = response.value[channel].configurations.sender_id;
                    const decryptedSenderId = await decryptString(encryptedSenderId, cypherKey.twilio_sid);
                    setSenderId(decryptedSenderId);
                }
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
            }
        };

        fetchData();
    }, [])


    const getInputConfig = () => {
        switch (channel) {
            case 'whatsapp':
                return {
                    label: 'WhatsApp Sender Number',
                    placeholder: 'e.g., +12025551234',
                    type: 'tel',
                    helpText: 'Must include country code (e.g., +1 for US/Canada)'
                };
            case 'sms':
                return {
                    label: 'SMS Sender Number',
                    placeholder: 'e.g., +12025551234',
                    type: 'tel',
                    helpText: 'Must include country code'
                };
            case 'email':
                return {
                    label: 'Email Sender Address',
                    placeholder: 'e.g., notifications@yourdomain.com',
                    type: 'email',
                    helpText: 'Must be a valid email address'
                };
            default:
                return {
                    label: 'Sender ID',
                    placeholder: '',
                    type: 'text',
                    helpText: ''
                };
        }
    };

    const { label, placeholder, type, helpText } = getInputConfig();

    const validateInput = async (): Promise<boolean> => {
        setIsValidating(true);
        try {
            if (!senderId.trim()) {
                setError('This field is required');
                return false;
            }

            if (channel === 'whatsapp' || channel === 'sms') {
                const isValid = await isPhoneNumberValid(senderId);
                if (!isValid) {
                    setError('Please enter a valid phone number');
                    return false;
                }
            } else if (channel === 'email') {
                if (!validateEmail(senderId)) {
                    setError('Please enter a valid email address');
                    return false;
                }
            }

            setError(null);
            return true;
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = await validateInput();
        if (!isValid) return;

        setIsSubmitting(true);

        try {
            console.log(cypherKey.twilio_sid);
            const encryptedSenderId = await encryptString(senderId, cypherKey.twilio_sid)
            const response = await updateSenderId(dispatch, channel, { sender_id: encryptedSenderId })
            console.log(response);

        } catch (err) {
            console.log(err);

            setError('Failed to save settings. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>
                {channel.charAt(0).toUpperCase() + channel.slice(1)} Settings
            </h2>
            <p className={styles.formDescription}>
                Configure sender information for your {channel} channel
            </p>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="senderId" className={styles.label}>
                        {label}
                    </label>
                    <input
                        type={type}
                        id="senderId"
                        value={senderId}
                        onChange={(e) => {
                            setSenderId(e.target.value);
                            setError(null);
                        }}
                        placeholder={placeholder}
                        className={`${styles.textInput} ${error ? styles.inputError : ''}`}
                        disabled={isSubmitting || isValidating}
                    />
                    {helpText && (
                        <p className={styles.helpText}>{helpText}</p>
                    )}
                </div>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || isValidating || !senderId.trim()}
                >
                    {isSubmitting ? (
                        <>
                            <span className={styles.loadingIndicator} />
                            Saving...
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChannelSettings;