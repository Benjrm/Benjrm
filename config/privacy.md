# Datenschutzerklärung
**Stand: 03.06.2026**

---

## 1. Verantwortlicher

Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze sowie sonstiger datenschutzrechtlicher Bestimmungen ist:

**[Name der Organisation / des Anbieters]**  
[Straße und Hausnummer]  
[PLZ und Ort]  
Deutschland

E-Mail: [datenschutz@example.com]  
Website: [https://www.example.com]

---

## 2. Datenschutzbeauftragter

Soweit gesetzlich vorgeschrieben (insbesondere bei Behörden, öffentlichen Stellen, Schulen in öffentlicher Trägerschaft oder einer umfangreichen Verarbeitung besonderer Datenkategorien), wurde ein betrieblicher Datenschutzbeauftragter bestellt:

**[Name des Datenschutzbeauftragten oder: kein Datenschutzbeauftragter bestellt]**  
 E-Mail: [dsb@example.com]

*Hinweis: Datenschutzanfragen können jederzeit an die oben genannte Kontaktadresse des Verantwortlichen gerichtet werden.*

---

## 3. Allgemeines zur Datenverarbeitung

### 3.1 Umfang der Verarbeitung personenbezogener Daten

Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Webanwendung sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten erfolgt regelmäßig nur auf Grundlage einer gesetzlichen Erlaubnis oder nach Einwilligung der Nutzer.

### 3.2 Rechtsgrundlagen

* **Art. 6 Abs. 1 lit. a DSGVO** – Einwilligung der betroffenen Person.
* **Art. 6 Abs. 1 lit. b DSGVO** – Vertragserfüllung oder Durchführung vorvertraglicher Maßnahmen.
* **Art. 6 Abs. 1 lit. c DSGVO** – Erfüllung einer rechtlichen Verpflichtung.
* **Art. 6 Abs. 1 lit. f DSGVO** – Wahrung berechtigter Interessen des Verantwortlichen.

### 3.3 Datenlöschung und Speicherdauer

Personenbezogene Daten werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine längere Speicherung erfolgt nur, wenn dies durch gesetzliche Vorgaben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen) vorgeschrieben ist.

---

## 4. Hosting und Server-Protokolldaten

### 4.1 Serverstandort

Die Webanwendung wird ausschließlich auf eigenen Servern in Deutschland betrieben. Eine Übermittlung personenbezogener Daten in Drittländer außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums findet nicht statt.

### 4.2 Server-Protokolldaten (Logfiles)

Bei jedem Aufruf der Webanwendung erfasst unser Server automatisch folgende Daten in sogenannten Server-Logfiles:

* IP-Adresse des anfragenden Geräts
* Datum und Uhrzeit des Zugriffs
* Name und URL der abgerufenen Seite bzw. Ressource
* Übertragene Datenmenge
* HTTP-Statuscode
* Verwendeter Browser und Betriebssystem (User-Agent-String)
* Referrer-URL (zuvor besuchte Webseite, sofern vom Browser übermittelt)

Diese Daten werden zur Gewährleistung des sicheren und stabilen Betriebs der Webanwendung gespeichert und nicht mit anderen Datenquellen zusammengeführt.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Systemsicherheit und Fehleranalyse).

**Speicherdauer:** 14 Tage, danach erfolgt eine automatische Löschung oder vollständige Anonymisierung.

---

## 5. Cookies

Unsere Webanwendung setzt ausschließlich technisch notwendige Cookies ein. Diese Cookies sind für den Betrieb der Anwendung zwingend erforderlich und können nicht deaktiviert werden, ohne die Funktionsfähigkeit der Seite wesentlich zu beeinträchtigen. Sie enthalten keine personenbezogenen Inhalte über Ihr Nutzungsverhalten und werden weder zu Tracking- noch zu Werbezwecken verwendet.

Technisch notwendige Cookies werden insbesondere im Rahmen der Nutzer-Authentifizierung über unseren selbst gehosteten Identity-Provider Keycloak eingesetzt, um Anmeldesitzungen aufrechtzuerhalten.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b und lit. f DSGVO i. V. m. § 25 Abs. 2 TDDDG (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz). Für technisch notwendige Cookies und den Local Storage ist keine Einwilligung erforderlich.

**Speicherdauer:** Session-Cookies werden automatisch gelöscht, wenn Sie den Browser schließen. Persistente Authentifizierungs-Tokens werden nach Ablauf der Sitzungsdauer oder nach dem Abmelden automatisch ungültig gemacht. Einstellungen, die im Local Storage Ihres Browsers gespeichert werden, bleiben auf Ihrem Endgerät bestehen, bis Sie diese manuell über Ihre Browsereinstellungen löschen.
---

## 6. Registrierung und Nutzerkonto

### 6.1 Registrierungsvorgang

Für die Nutzung bestimmter Funktionen der Webanwendung ist eine Registrierung erforderlich. Registrierung und Verwaltung von Nutzerkonten erfolgen ausschließlich über unseren selbst gehosteten Identity-Provider **Keycloak**, der auf unseren eigenen Servern in Deutschland betrieben wird. Eine Übermittlung von Anmeldedaten an externe Dritte findet nicht statt.

Bei der Registrierung erheben wir folgende Daten:

* **E-Mail-Adresse:** Zur Identifikation des Nutzerkontos und für kontobezogene Benachrichtigungen (z. B. Passwort-Zurücksetzen).
* **Benutzername:** Zur Identifikation innerhalb der Anwendung; wird anderen Teilnehmern einer Spielsitzung angezeigt.
* **Zeitstempel der Kontoerstellung:** Wird intern protokolliert.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung; die Registrierung ist Voraussetzung zur Nutzung der Webanwendung).

### 6.2 Passwörter

Passwörter werden ausschließlich in verschlüsselter (gehashter) Form gespeichert und sind für uns nicht im Klartext einsehbar. Keycloak verwendet standardkonforme Hashing-Verfahren (z. B. bcrypt oder Argon2) gemäß aktuellem Stand der Technik (Art. 32 DSGVO).

### 6.3 Sitzungs-Tokens

Nach der Anmeldung stellt Keycloak kryptografisch gesicherte Sitzungs-Tokens aus (JSON Web Tokens). Diese werden im Browser gespeichert, um die Sitzung aufrechtzuerhalten, ohne das Passwort erneut eingeben zu müssen. Die Tokens werden nach dem Abmelden oder nach Ablauf der konfigurierten Gültigkeitsdauer automatisch ungültig gemacht und gelöscht.

**Speicherdauer Nutzerkonten:** Die Daten werden für die Dauer des aktiven Nutzerkontos gespeichert. Nach der Löschung des Kontos durch den Nutzer werden die Daten innerhalb von 30 Tagen vollständig aus den aktiven Systemen gelöscht.

---

## 7. Nutzung der Quiz- und Spielfunktionen

### 7.1 Registrierte Nutzer

Im Rahmen der Nutzung der interaktiven Quiz-Funktionen durch registrierte Nutzer werden folgende Daten verarbeitet:

* **Spielergebnisse und Punkte:** Erzielte Punktzahlen und Platzierungen innerhalb einer Spielsitzung.
* **Antworten auf Quizfragen:** Die ausgewählten Antworten während einer Spielsitzung.
* **Sitzungsdaten:** Zuordnung der Teilnehmer zu einer Spielsitzung (z. B. anhand des Benutzernamens oder eines Sitzungscodes).

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung; Bereitstellung der Kernanwendung).

**Speicherdauer:** Quiz-Sitzungsdaten und dazugehörige Spielergebnisse werden nach 90 Tagen automatisch gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen. Zusätzlich können bei registrierten Nutzern vergangene Spielsitzungen, Spielergebnisse und beantwortete Quizfragen gespeichert werden, um eine persönliche Spielhistorie bereitzustellen. Die Historie bleibt gespeichert, bis das Nutzerkonto gelöscht wird oder der Nutzer die entsprechenden Daten selbst entfernt.

### 7.2 Anonymer Gast-Modus

Die Teilnahme an Spielsitzungen ist auch ohne Registrierung als anonymer Gast möglich. Dabei werden folgende Daten verarbeitet:

* **Frei gewählter Spitzname:** Wird ausschließlich zur Anzeige innerhalb der laufenden Sitzung verwendet. Der Spitzname wird nicht dauerhaft gespeichert und nach Beendigung der Sitzung gelöscht.
* **Spielergebnisse und Antworten:** Werden ausschließlich für die Dauer der Sitzung im Arbeitsspeicher gehalten und nicht persistent gespeichert.
* **Server-Logdaten:** Die IP-Adresse des Gastnutzers wird wie bei jedem anderen Zugriff für 14 Tage in den Server-Logfiles erfasst (siehe Abschnitt 4.2).

Es werden keine dauerhaften Profile über Gastnutzer erstellt. Eine Zuordnung von Sitzungsdaten zu einer natürlichen Person ist nach Sitzungsende nicht mehr möglich.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung eines datenschutzfreundlichen Zugangs ohne Kontoregistrierung).

---

## 8. Nutzererstellte Inhalte

Registrierte Nutzer können eigene Quizze erstellen und speichern.

Hierbei werden insbesondere folgende Daten verarbeitet:

* Quiztitel
* Quizbeschreibung
* Fragen und Antwortmöglichkeiten
* Erstellungs- und Änderungszeitpunkte
* Zuordnung zum Nutzerkonto

**Rechtsgrundlage:**
Art. 6 Abs. 1 lit. b DSGVO. (Vertragserfüllung; Bereitstellung der Kernanwendung).

Die Daten bleiben gespeichert, bis sie durch den Nutzer gelöscht werden oder das Nutzerkonto entfernt wird.

---

## 9. Profilbilder und Dateiuploads

Registrierte Nutzer können freiwillig Profilbilder hochladen.

Profilbilder werden ausschließlich zur Darstellung innerhalb der Plattform verwendet.

**Rechtsgrundlage:**
Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Upload) sowie Art. 6 Abs. 1 lit. b DSGVO.

Profilbilder werden gelöscht, sobald sie durch den Nutzer entfernt oder das Nutzerkonto gelöscht wird.

---

## 10. Kontaktformular

Wenn Sie uns über das Kontaktformular kontaktieren, werden die von Ihnen eingegebenen Daten verarbeitet, um Ihre Anfrage zu bearbeiten.

Dabei können insbesondere folgende Daten verarbeitet werden:

* Name (sofern angegeben)
* E-Mail-Adresse
* Betreff
* Nachrichtentext
* Zeitpunkt der Anfrage

Die Verarbeitung erfolgt ausschließlich zur Bearbeitung und Beantwortung Ihrer Anfrage.

**Rechtsgrundlage:**
Art. 6 Abs. 1 lit. b DSGVO (bei vertragsbezogenen Anfragen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung sonstiger Anfragen).

**Speicherdauer:**
Anfragen werden nach abschließender Bearbeitung gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.

---

## 11. Besondere Hinweise zum Schutz von Minderjährigen

> ⚠️ **Dieser Abschnitt ist besonders wichtig für den Einsatz im schulischen und bildungsbezogenen Kontext.**

### 11.1 Altersgrenze und elterliche Einwilligung (Art. 8 DSGVO)

Gemäß Art. 8 DSGVO ist die Einwilligung eines Kindes in die Verarbeitung personenbezogener Daten bei Nutzung von Diensten der Informationsgesellschaft in Deutschland erst ab dem vollendeten **16. Lebensjahr** rechtswirksam. Für Kinder unter 16 Jahren ist die Einwilligung bzw. Zustimmung eines Erziehungsberechtigten erforderlich.

Für die Nutzung der Plattform durch Minderjährige unter 16 Jahren gilt:

* Die Registrierung mit einem eigenen Nutzerkonto ist für Kinder unter 16 Jahren nur mit **nachweislicher Einwilligung eines Erziehungsberechtigten** zulässig.
* Lehr- und pädagogische Fachkräfte, die die Plattform im schulischen Kontext einsetzen, tragen die Verantwortung dafür, dass die erforderlichen rechtlichen Grundlagen bzw. Einwilligungen vorliegen, soweit personenbezogene Daten von Schülerinnen und Schülern unter 16 Jahren verarbeitet werden. Dies kann sich je nach Bundesland auch aus den jeweiligen Landesdatenschutzgesetzen und Schulgesetzen ergeben.
* **Anonymer Gast-Modus als Standard:** Um den datenschutzkonformen Einsatz in Schulen maximal zu vereinfachen, unterstützen wir die Teilnahme an Spielsitzungen als anonymer Gast (ohne Registrierung) mittels eines frei wählbaren Spitznamens. Wir empfehlen ausdrücklich, für Minderjährige unter 16 Jahren keine eigenen Nutzerkonten anzulegen, sondern diese Funktion zu nutzen.

### 11.2 Hinweis zur Auftragsverarbeitung im Schulkontext (Art. 28 DSGVO)

Setzen Schulen oder andere Bildungseinrichtungen die Plattform im Rahmen ihres Unterrichts ein und werden dabei personenbezogene Daten von Schülerinnen und Schülern verarbeitet, kann zwischen der Schule (als Verantwortlicher) und dem Plattformbetreiber eine Auftragsverarbeitungsbeziehung im Sinne des Art. 28 DSGVO bestehen. Institutionelle Nutzer, die die Plattform im Namen einer Schule oder Bildungseinrichtung einsetzen, wenden sich bitte an die unter Abschnitt 1 genannte Kontaktadresse, um einen **Auftragsverarbeitungsvertrag (AVV)** abzuschließen, sofern dies nach den konkreten Umständen rechtlich erforderlich ist.

### 11.3 Keine Profilbildung und kein Tracking von Kindern

Wir erstellen keine Profile über Minderjährige, führen kein Tracking durch und schalten keine Werbung. Personenbezogene Daten von Kindern werden weder an Dritte weitergegeben noch für andere Zwecke als den technischen Betrieb der Plattform genutzt.

### 11.4 Recht auf Löschung von Kinderdaten

Erziehungsberechtigte können jederzeit Auskunft über die zu ihrem Kind gespeicherten Daten verlangen und deren Löschung beantragen. Hierfür wenden Sie sich bitte an die unter Abschnitt 1 genannte Kontaktadresse.

---

## 12. Weitergabe von Daten an Dritte

Eine Übermittlung personenbezogener Daten an Dritte findet grundsätzlich nicht statt. Ausnahmen bestehen nur in folgenden Fällen:

* **Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):** Sie haben der Weitergabe ausdrücklich zugestimmt.
* **Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):** Eine Weitergabe ist gesetzlich vorgeschrieben (z. B. Auskünfte an Strafverfolgungsbehörden).
* **Rechtsverteidigung (Art. 6 Abs. 1 lit. f DSGVO):** Die Weitergabe ist zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich.

**Keine Drittanbieter-Dienste:** Wir setzen keine externen Analyse-, Tracking-, Werbe- oder Cloud-Dienste ein. Alle Systemkomponenten (Webserver, Datenbank, Keycloak) werden auf eigenen Servern in Deutschland betrieben. Es findet keine Übermittlung in Drittländer außerhalb des EWR statt.

---

## 13. Datensicherungen (Backups)

Zur Gewährleistung der Verfügbarkeit und Wiederherstellbarkeit der Plattform werden regelmäßig verschlüsselte Sicherungskopien der Datenbank erstellt.

Backups werden ausschließlich auf eigenen Servern in Deutschland gespeichert und nicht für andere Zwecke verwendet.

Backups werden nach Ablauf eines angemessenen Sicherungszeitraums automatisch gelöscht.

---

## 14. Technische und organisatorische Maßnahmen

Wir treffen geeignete technische und organisatorische Maßnahmen gemäß Art. 32 DSGVO, um personenbezogene Daten zu schützen.

Hierzu gehören insbesondere:

* TLS-Verschlüsselung (HTTPS)
* Zugriffsbeschränkungen auf Server und Datenbanken
* Regelmäßige Sicherheitsupdates
* Passwort-Hashing nach aktuellem Stand der Technik
* Rollen- und Berechtigungskonzepte
* Protokollierung sicherheitsrelevanter Ereignisse
* Verschlüsselte Datensicherungen

---

## 15. Übersicht der Speicherfristen

| Datenkategorie                                               | Speicherdauer                                                                                                         |
|--------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Nutzerkontodaten (E-Mail, Benutzername)                      | Solange das Konto aktiv ist; nach Löschung endgültig binnen 30 Tagen                                                  |
| Server-Protokolldaten (IP-Adresse, Zugriffsdaten)            | 14 Tage, danach automatische Löschung/Anonymisierung                                                                  |
| Quiz-Sitzungsdaten und Spielergebnisse (registrierte Nutzer) | 90 Tage (automatische Löschung) bzw. bis zur Löschung durch den Nutzer oder des Kontos bei persönlicher Spielhistorie |
| Gast-Sitzungsdaten (Spitzname, Ergebnisse)                   | Nur für Dauer der Sitzung; keine persistente Speicherung                                                              |
| Nutzererstellte Inhalte (Quizze)                             | Bis zur Löschung durch den Nutzer oder Entfernung des Kontos                                                          |
| Profilbilder                                                 | Bis zur Entfernung durch den Nutzer oder Kontolöschung                                                                |
| Kontaktformular-Anfragen                                     | Nach abschließender Bearbeitung, sofern keine gesetzlichen Aufbewahrungspflichten bestehen                            |
| Datensicherungen (Backups)                                   | Nach Ablauf eines angemessenen Sicherungszeitraums                                                                    |
| Session-Cookies und Authentifizierungs-Tokens                | Automatisch nach Sitzungsende oder Token-Ablauf                                                                       |
| Daten mit gesetzlicher Aufbewahrungspflicht                  | Gemäß gesetzlicher Frist (z. B. 6 bzw. 10 Jahre nach AO/HGB)                                                          |

---

## 16. Ihre Rechte als betroffene Person

Sie können Ihre Rechte jederzeit durch eine formlose Nachricht an die unter Abschnitt 1 genannte Kontaktadresse geltend machen. Wir beantworten Anfragen in der Regel innerhalb von 30 Tagen.

### 16.1 Auskunftsrecht (Art. 15 DSGVO)

Sie haben das Recht, Auskunft darüber zu erhalten, ob und welche personenbezogenen Daten wir von Ihnen verarbeiten, einschließlich Zweck, Herkunft, Empfänger und geplante Speicherdauer.

### 16.2 Recht auf Berichtigung (Art. 16 DSGVO)

Sie haben das Recht, die unverzügliche Berichtigung unrichtiger oder unvollständiger Daten zu verlangen. Viele Daten können Sie direkt in Ihren Kontoeinstellungen selbst anpassen.

### 16.3 Recht auf Löschung („Recht auf Vergessenwerden", Art. 17 DSGVO)

Sie können die Löschung Ihrer personenbezogenen Daten verlangen, sofern kein gesetzlicher Aufbewahrungsgrund entgegensteht. Ihr Nutzerkonto können Sie jederzeit selbst löschen.

### 16.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)

Sie können die Einschränkung der Verarbeitung verlangen, wenn Sie die Richtigkeit der Daten bestreiten, die Verarbeitung unrechtmäßig ist, Sie die Daten zur Rechtsverfolgung benötigen oder Sie Widerspruch eingelegt haben.

### 16.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)

Sie haben das Recht, die von Ihnen bereitgestellten personenbezogenen Daten in einem gängigen, maschinenlesbaren Format zu erhalten (z. B. JSON), sofern die Verarbeitung auf einer Einwilligung oder einem Vertrag beruht und automatisiert erfolgt.

### 16.6 Widerspruchsrecht (Art. 21 DSGVO)

Soweit Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) verarbeitet werden, können Sie jederzeit Widerspruch einlegen. Wir stellen die Verarbeitung dann ein, sofern keine zwingenden schutzwürdigen Gründe dagegenstehen.

### 16.7 Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)

Soweit die Verarbeitung auf einer Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.

---

## 17. Beschwerderecht bei der Datenschutz-Aufsichtsbehörde

Sie haben gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die DSGVO verstößt.

**Zuständige Aufsichtsbehörde:**

[Name der zuständigen Landesdatenschutzbehörde des Bundeslandes, in dem der Anbieter seinen Sitz hat, z. B. Der Hessische Beauftragte für Datenschutz und Informationsfreiheit]
\[Straße und Hausnummer\]
[PLZ und Ort]
\[Website der Behörde\]

---

## 18. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen, technische Weiterentwicklungen oder Änderungen unserer Dienste anzupassen. Die jeweils aktuelle Version ist stets auf unserer Website abrufbar. Bei wesentlichen Änderungen werden registrierte Nutzer per E-Mail an die hinterlegte E-Mail-Adresse informiert.

**Datum der letzten Aktualisierung:** 03.06.2026
