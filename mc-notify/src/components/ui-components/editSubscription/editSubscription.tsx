import { useAsyncDispatch } from '@commercetools-frontend/sdk';
import { useEffect, useState } from "react";
import { updateMessageBodyHook } from "../../../hooks/channel/updateChannel.hooks";
import { fetchCurrentResourceData } from "../../../repository/fetchResouces.repository";
import styles from "../createTrigger/TriggerSearchForm.module.css";
import MessageBox from "../messageBox/MessageBox";
import PlaceholderSearch from "../placeholderSearch/PlaceholderSearch";
import componentStyle from './editSubscription.module.css';

type EditSubscriptionProps = {
    resourceType: string;
    messageBody: {
        message: string;
        sendToPath: string;
    }
    triggerName: string;
    channel: string;
}

const EditSubscription = ({ resourceType, messageBody, channel, triggerName }: EditSubscriptionProps) => {
    const [messageBodyValue, setMessageBodyValue] = useState(messageBody.message);
    const [templateData, setTemplateData] = useState<{ id: string }[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [selectedTemplateData, setSelectedTemplateData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [sendToPath, setSendToPath] = useState(messageBody.sendToPath)

    const dispatch = useAsyncDispatch();

    // Sync the local state with the prop when it changes
    useEffect(() => {
        setMessageBodyValue(messageBody.message);
    }, [messageBody]);

    const handleResourceDataFetch = async () => {
        try {
            const response = await fetchCurrentResourceData(dispatch, resourceType);
            setTemplateData(response);
            return response;
        } catch (error) {
            console.error("Error fetching resource data:", error);
            throw error;
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const messageBodyPayload = {
                [triggerName]: {
                    message: messageBodyValue,
                    sendToPath: sendToPath
                },
            };
            await updateMessageBodyHook(dispatch, channel, messageBodyPayload);
            console.log("Changes saved successfully:", messageBodyPayload);
        } catch (error) {
            console.error("Error saving changes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        const selectedData = templateData.find((item) => item.id === templateId);
        setSelectedTemplate(templateId);
        setSelectedTemplateData(selectedData || {});
    };

    const handlePlaceholderSelect = (placeholder: string) => {
        setSendToPath(placeholder);
    };

    return (
        <div className={styles.formContainer}>
            <div className={componentStyle.headerContainer}>
                <div className={componentStyle.header}>
                    <h3 className={componentStyle.title}>Edit Subscription</h3>
                </div>
                <div className={componentStyle.triggerHeader}>
                    <span className={componentStyle.triggerTitle}>{triggerName}</span>
                </div>
            </div>

            <div className={styles.templateSearchContainer}>
                <br />
                <label htmlFor="templateSelection" className={styles.label}>
                    Choose Template
                </label>
                <select
                    id="templateSelection"
                    value={selectedTemplate}
                    onFocus={handleResourceDataFetch}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className={styles.searchInput}
                >
                    <option value="">Select a template...</option>
                    {templateData.map((res) => (
                        <option key={res.id} value={res.id} className={styles.dropdownItem}>
                            {resourceType}-{res.id}
                        </option>
                    ))}
                </select>
            </div>

            {selectedTemplate && (
                <div>
                    <br />
                    <label htmlFor="templateSelection" className={styles.label}>
                        Delivery address
                        <br />
                        <small>Choose the appropriate delivery address field. </small>
                    </label>
                    <PlaceholderSearch
                        curretnValue={sendToPath}
                        templateData={selectedTemplateData}
                        onSelect={handlePlaceholderSelect}
                        placeholder="Select a delivery address..."
                    />
                    <br />
                    <MessageBox
                        selectedTemplateData={selectedTemplateData}
                        messageBody={messageBodyValue}
                        onMessageChange={setMessageBodyValue} placeholder={"Type your message here. Use {{}} to insert variables..."} title={"Edit template"} />
                    <br />
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className={styles.submitButton}
                        disabled={!messageBodyValue || isLoading}
                    >
                        {isLoading ? (
                            <div className={styles.loadingContainer}>
                                <span className={styles.loadingIndicator}></span>
                                <small>Saving</small>
                            </div>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>)}
        </div>
    );
};

export default EditSubscription;