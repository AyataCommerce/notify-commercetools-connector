import styles from './loader.module.css'
const Loader = () => {
    return (
        <div>
            <div className={styles.threeBody}>
                <div className={styles.threeBodyDot}></div>
                <div className={styles.threeBodyDot}></div>
                <div className={styles.threeBodyDot}></div>
            </div></div>
    )
}

export default Loader