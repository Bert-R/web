import {
    AppBar,
    ClickAwayListener,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Popover,
    Toolbar,
    Typography,
} from '@mui/material';
import styles from './settings.module.css';
import headerStyles from '../trackfavmenu.module.css';
import AppContext from '../../context/AppContext';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import langList from '../../resources/translations/supportedLanguages.json';
import enList from '../../resources/translations/en/translation.json';

import { ReactComponent as CloseIcon } from '../../assets/icons/ic_action_close.svg';
import { ReactComponent as DisplayLanguageIcon } from '../../assets/icons/ic_action_map_language.svg';
import { MENU_INFO_CLOSE_SIZE } from '../../manager/GlobalManager';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '../../util/hooks/useWindowSize';
import * as locales from 'date-fns/locale';
import { format } from 'date-fns';
import i18n from '../../i18n';

export function getLocalizedTimeUpdate(time) {
    const locale = locales[i18n.language] || locales.enUS;
    const currentDate = new Date(time);
    return format(currentDate, 'MMM d', { locale });
}

export default function SettingsMenu() {
    const ctx = useContext(AppContext);

    const [openLangList, setOpenLangList] = useState(false);
    const { i18n, t } = useTranslation();
    const [currentLang, setCurrentLang] = useState(t(`lang_${i18n.language}`));
    const anchorEl = useRef(null);
    const [, height] = useWindowSize();

    function close() {
        ctx.setInfoBlockWidth(MENU_INFO_CLOSE_SIZE);
        ctx.setCurrentObjectType(null);
    }

    useEffect(() => {
        async function handleLanguageChange(lng) {
            try {
                const translation = await import(`../../resources/translations/${lng}/translation.json`);
                if (translation) {
                    i18n.addResourceBundle(lng, 'translation', translation.default, true, true);
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Could not load translation.json for language: ${lng}`);
                }
            }

            try {
                const webTranslation = await import(`../../resources/translations/${lng}/web-translation.json`);
                if (webTranslation) {
                    i18n.addResourceBundle(lng, 'web', webTranslation.default, true, true);
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Could not load web-translation.json for language: ${lng}`);
                }
            }

            localStorage.setItem('i18nextLng', lng);
            setCurrentLang(t(`lang_${lng}`));
        }

        i18n.on('languageChanged', handleLanguageChange);
        handleLanguageChange(i18n.language).then();

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n, t]);

    function selectLanguage() {
        setOpenLangList(true);
    }

    function getTransLanguage(lang) {
        const trans = t(`lang_${lang}`).toString();
        return trans.startsWith('lang_') ? enList[`lang_${lang}`] : trans;
    }

    const languageList = useMemo(() => {
        if (langList && currentLang) {
            let res = [];
            let sortedLangList = [...langList].sort((a, b) => {
                const transA = getTransLanguage(a);
                const transB = getTransLanguage(b);
                return transA?.localeCompare(transB);
            });
            sortedLangList.map((lang, index) => {
                const transLang = getTransLanguage(lang);
                if (transLang) {
                    res.push(
                        <MenuItem
                            key={lang + index}
                            onClick={async () => {
                                await i18n.changeLanguage(lang).then(() => {
                                    setCurrentLang(t(`lang_${i18n.language}`));
                                });
                                setOpenLangList(false);
                                ctx.setOpenedPopper(null);
                            }}
                        >
                            <ListItemText>
                                <Typography variant="inherit" noWrap>
                                    {transLang}
                                </Typography>
                            </ListItemText>
                        </MenuItem>
                    );
                }
            });
            return res;
        }
    }, [i18n, ctx, currentLang, t]);

    return (
        <>
            <AppBar position="static" className={headerStyles.appbar}>
                <Toolbar className={headerStyles.toolbar}>
                    <IconButton variant="contained" type="button" className={styles.closeIcon} onClick={close}>
                        <CloseIcon />
                    </IconButton>
                    <Typography id="se-configure-map-menu-name" component="div" className={headerStyles.title}>
                        {t('shared_string_settings')}
                    </Typography>
                </Toolbar>
            </AppBar>
            <MenuItem className={styles.item}>
                <Typography className={styles.title} noWrap>
                    {t('general_settings_2')}
                </Typography>
            </MenuItem>
            <MenuItem divider className={styles.item} onClick={selectLanguage}>
                <ListItemIcon className={styles.icon}>
                    <DisplayLanguageIcon />
                </ListItemIcon>
                <ListItemText>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="inherit" noWrap>
                            {t('preferred_locale')}
                        </Typography>
                        <Typography ref={anchorEl} variant="body2" className={styles.lang} noWrap>
                            {currentLang}
                        </Typography>
                    </div>
                </ListItemText>
            </MenuItem>
            <Popover
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={{ ml: '8px', mt: '40px', maxHeight: height / 2 }}
                open={openLangList}
                anchorEl={anchorEl.current}
                disablePortal={true}
            >
                <ClickAwayListener
                    onClickAway={() => {
                        setOpenLangList(false);
                        ctx.setOpenedPopper(null);
                    }}
                >
                    <div>{languageList}</div>
                </ClickAwayListener>
            </Popover>
        </>
    );
}
