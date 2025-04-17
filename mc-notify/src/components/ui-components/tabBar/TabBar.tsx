import styles from './tab-bar.module.css';

type TabBarProps = {
    tabs: {
        id: string;
        label: string;
        icon: string;
    }[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
};

const TabBar = ({ tabs, activeTab, onTabChange }: TabBarProps) => {
    return (
        <div className={styles.tabBar}>
            {tabs.map((tab) => (
                <div key={tab.id} className={`${styles.tab} ${tab.id === activeTab ? styles.tabActive : ''}`} onClick={() => onTabChange(tab.id)}>

                    <div className={styles.tabName}>
                        <img src={tab.icon} alt="Tab icon" />
                        {tab.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TabBar;