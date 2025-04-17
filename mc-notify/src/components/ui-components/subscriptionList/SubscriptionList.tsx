import { useAsyncDispatch } from '@commercetools-frontend/sdk';
import React, { useEffect, useState } from "react";
import disconnectIcon from "../../../assets/icons/disconnect_icon.svg";
import editIcon from "../../../assets/icons/edit_icon.svg";
import { removeSubscriptionHook } from "../../../hooks/subscription/removeSubscription.hooks";
import { RemoveSubscriptionRequestInterface } from "../../../interfaces/subscription.interface";
import EditSubscription from "../editSubscription/editSubscription";
import FilterDropdown from "../filterDropDown/FilterDropdown";
import Pagination from "../pagination/Pagination";
import SearchBar from "../searchBar/SearchBar";
import styles from "./subscriptionList.module.css";
import notFound from "./not-found.png"

type Subscription = {
    resourceType: string;
    triggers?: { triggerType: string; subscribedAt: string }[];
};

type MessageData = {
    [key: string]: {
        subject?: string;
        message: string;
        sendToPath: string;
    };
};

type SubscriptionListProps = {
    subscriptionList: { subscriptions: Subscription[] };
    channel: string;
    messageData: MessageData;
};

const ITEMS_PER_PAGE = 5;

const SubscriptionList = ({ subscriptionList, channel, messageData }: SubscriptionListProps) => {
    const dispatch = useAsyncDispatch();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [subList, setSubList] = useState<{ subscriptions: Subscription[] }>({ subscriptions: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<{ resourceType: string | null; triggerType: string | null }>({
        resourceType: null,
        triggerType: null
    });

    useEffect(() => {
        setSubList(subscriptionList);
        setCurrentPage(1); // Reset to first page when subscription list changes
    }, [subscriptionList]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
    };

    const toggleRow = (rowKey: string) => {
        setExpandedRow(expandedRow === rowKey ? null : rowKey);
    };

    const handleUnsubscribe = async (resourceType: string, triggerType: string) => {
        try {
            const subscription: RemoveSubscriptionRequestInterface = {
                channel,
                subscription: {
                    resourceType,
                    triggerType,
                },
            };

            await removeSubscriptionHook(dispatch, subscription);

            setSubList((prev) => ({
                subscriptions: prev.subscriptions
                    .map((sub) => {
                        if (sub.resourceType === resourceType) {
                            const updatedTriggers = sub.triggers?.filter(t => t.triggerType !== triggerType);
                            return { ...sub, triggers: updatedTriggers };
                        }
                        return sub;
                    })
                    .filter(sub => sub.triggers?.length),
            }));

            setExpandedRow(null);
        } catch (error) {
            console.error("Error unsubscribing from trigger:", error);
        }
    };

    // Get unique resource types for filter dropdown
    const resourceTypes = Array.from(
        new Set(subList.subscriptions?.map(sub => sub.resourceType) || [])
    );

    // Get unique trigger types for filter dropdown
    const triggerTypes = Array.from(
        new Set(
            subList.subscriptions?.flatMap(sub =>
                sub.triggers?.map(trigger => trigger.triggerType) || []
            ) || []
        )
    );

    // Filter and search logic
    const filteredSubscriptions = subList.subscriptions
        ?.filter(subscription => {
            // Apply resource type filter
            if (filter.resourceType && subscription.resourceType !== filter.resourceType) {
                return false;
            }

            // Apply trigger type filter if subscription has triggers
            if (filter.triggerType &&
                !subscription.triggers?.some(trigger => trigger.triggerType === filter.triggerType)) {
                return false;
            }

            return true;
        })
        ?.flatMap(subscription =>
            subscription.triggers?.map(trigger => ({
                ...trigger,
                resourceType: subscription.resourceType,
                rowKey: `${subscription.resourceType}-${trigger.triggerType}`
            })) || []
        )
        ?.filter(item => {
            // Apply search term
            if (!searchTerm) return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                item.resourceType.toLowerCase().includes(lowerSearchTerm) ||
                item.triggerType.toLowerCase().includes(lowerSearchTerm)
            );
        }) || [];

    // Pagination logic
    const totalItems = filteredSubscriptions.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginatedItems = filteredSubscriptions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (!subList?.subscriptions?.length) {
        return <div className={styles.notFoundImage}>
            <img src={notFound} alt="" />
            <p> Sorry, no subscriptions found.</p>
        </div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Search subscriptions..."
                />

                <div className={styles.filters}>
                    <FilterDropdown
                        options={resourceTypes}
                        selectedValue={filter.resourceType}
                        onSelect={(value) => setFilter(prev => ({ ...prev, resourceType: value }))}
                        placeholder="Filter by resource type"
                    />

                    <FilterDropdown
                        options={triggerTypes}
                        selectedValue={filter.triggerType}
                        onSelect={(value) => setFilter(prev => ({ ...prev, triggerType: value }))}
                        placeholder="Filter by trigger type"
                    />

                    <button
                        className={styles.clearFilters}
                        onClick={() => setFilter({ resourceType: null, triggerType: null })}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Trigger Type</th>
                        <th>Resource Type</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedItems.length > 0 ? (
                        paginatedItems.map((item) => {
                            const messageBody = messageData[item.triggerType] || {};
                            return (
                                <React.Fragment key={item.rowKey}>
                                    <tr>
                                        <td>{item.triggerType}</td>
                                        <td>{item.resourceType}</td>
                                        <td>{formatDate(item.subscribedAt)}</td>
                                        <td className={styles.actionButtonCollection}>
                                            <button
                                                className={`${styles.actionButton} ${styles.actionEditButton}`}
                                                data-tooltip="Edit"
                                                onClick={() => toggleRow(item.rowKey)}
                                            >
                                                <img src={editIcon} alt="Edit" />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.actionDisconnectButton}`}
                                                data-tooltip="Unsubscribe"
                                                onClick={() =>
                                                    handleUnsubscribe(item.resourceType, item.triggerType)
                                                }
                                            >
                                                <img src={disconnectIcon} alt="Disconnect" />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRow === item.rowKey && (
                                        <tr className={`${styles.expandableRow} ${styles.expanded}`}>
                                            <td colSpan={4}>
                                                <div className={styles.expandedContent}>
                                                    <EditSubscription
                                                        resourceType={item.resourceType}
                                                        messageBody={messageBody}
                                                        channel={channel}
                                                        triggerName={item.triggerType}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={4} className={styles.noResults}>
                                No subscriptions found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};

export default SubscriptionList;