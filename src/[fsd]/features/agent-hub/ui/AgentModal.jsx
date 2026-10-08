import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import { AgentDetails } from '@/[fsd]/features/agent';
import AgentConversationStarters from '@/[fsd]/features/agent-hub/ui/AgentConversationStarters';
import AgentHubLike from '@/[fsd]/features/agent-hub/ui/AgentHubLike';
import AgentHubModalMenu from '@/[fsd]/features/agent-hub/ui/AgentHubModalMenu';
import AgentWelcomeMessage from '@/[fsd]/features/agent-hub/ui/AgentWelcomeMessage';
import { ELITEA_CATALOG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { Button as SharedButton } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';
import { useLazyPublicApplicationDetailsQuery } from '@/api';
import { ChatParticipantType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import EntityIcon from '@/components/EntityIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import RouteDefinitions, { getBasename } from '@/routes';
import { actions } from '@/slices/chat';

import { AgentHubConstants } from '../lib/constants';

const getCardAuthors = (agent, agentDetails) => {
  const { authors = [], author = {} } = agent || {};
  if (authors?.length) {
    return authors;
  } else {
    if (author.id) {
      return [author];
    } else {
      if (agentDetails?.version_details?.author) return [agentDetails?.version_details?.author];
      return [];
    }
  }
};

const AgentModal = memo(props => {
  const { open, onClose, agent } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [agentDetails, setAgentDetails] = useState(null);
  const cardAuthors = useMemo(() => getCardAuthors(agent, agentDetails), [agent, agentDetails]);
  const [getPublicApplicationDetail, { isFetching }] = useLazyPublicApplicationDetailsQuery();
  const styles = agentModalStyles();
  const [showContext, setShowContext] = useState(false);
  const [isSmallHeight, setIsSmallHeight] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const descriptionRef = useRef(null);
  const name = useMemo(() => agent?.name || agentDetails?.name || 'Untitled Agent', [agent, agentDetails]);
  const description = useMemo(
    () => agent?.description || agentDetails?.description || 'No description available.',
    [agent, agentDetails],
  );
  const icon_meta = useMemo(
    () => agent?.icon_meta || agentDetails?.version_details?.icon_meta,
    [agent, agentDetails],
  );
  const versionId = useMemo(() => agentDetails?.version_details?.id, [agentDetails]);
  const link = useMemo(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    const pathPrefix = basename ? basename : '';
    return agent
      ? `${baseUrl}${pathPrefix}${RouteDefinitions.EliteaCatalog}?tab=agents&${AgentHubConstants.AGENT_ID}=${agent.id}`
      : '';
  }, [agent]);

  const checkHeight = useCallback(() => {
    setIsSmallHeight(window.innerHeight <= 390);
  }, []);

  const getDetails = useCallback(async () => {
    if (agent) {
      const result = await getPublicApplicationDetail({
        projectId: PUBLIC_PROJECT_ID,
        applicationId: agent.id,
      });
      setAgentDetails(result?.data || null);
      // setWelcomeMessage(result?.data?.version_details?.welcome_message || '');
      setWelcomeMessage(`# Quality Assurance: A Comprehensive Overview

## What is QA?

Quality Assurance (QA) is a systematic process designed to ensure that products, services, or deliverables meet specified quality standards and customer expectations. QA focuses on preventing defects through planned and systematic activities, rather than just finding them after they occur.

## QA vs. Quality Control (QC)

**Quality Assurance (QA)**
- Process-focused
- Proactive and preventive
- Applies throughout development
- Aims to prevent defects
- Answers: "Are we building it right?"

**Quality Control (QC)**
- Product-focused
- Reactive and detective
- Applied after development
- Aims to catch defects
- Answers: "Did we build it right?"

Together, they form a complete quality management system.

## Core Principles of QA

**Prevention Over Detection**
- Better to prevent defects than find them later
- Early involvement in development process
- Establishing standards and processes upfront

**Continuous Improvement**
- Regularly analyze processes
- Implement lessons learned
- Iterate and refine approaches

**Documentation**
- Clear procedures and checklists
- Traceability of requirements
- Evidence of compliance

**Communication**
- Cross-functional collaboration
- Clear expectation setting
- Transparent reporting

## QA in Software Development

### Testing Types

**Unit Testing**
- Tests individual code components or functions
- Usually performed by developers
- Catches logic errors early
- Fast to execute

**Integration Testing**
- Tests how different modules work together
- Verifies data flows between components
- Catches interface defects
- More complex than unit testing

**System Testing**
- Tests the complete integrated system
- Verifies against system requirements
- Includes performance and security
- Closer to real-world usage

**Acceptance Testing**
- Validates against business requirements
- Often performed by end-users or business analysts
- Confirms readiness for production
- Final gate before release

**Regression Testing**
- Ensures new changes don't break existing functionality
- Repeated after code modifications
- Critical for maintaining stability
- Often automated for efficiency

**Performance Testing**
- Tests speed, scalability, and stability under load
- Identifies bottlenecks
- Ensures system meets performance requirements
- Examples: load testing, stress testing, endurance testing

**Security Testing**
- Identifies vulnerabilities and threats
- Tests authentication and authorization
- Checks for data protection
- Increasingly critical in modern development

**Usability Testing**
- Evaluates user experience and interface
- Tests with actual or representative users
- Identifies design issues
- Provides feedback on functionality

### Testing Approaches

**Black Box Testing**
- Tester has no knowledge of internal code
- Tests based on requirements and specifications
- Simulates real user behavior
- Effective for catching unexpected issues

**White Box Testing**
- Tester has knowledge of internal code
- Tests specific code paths and logic
- More thorough but requires technical expertise
- Useful for unit and integration testing

**Gray Box Testing**
- Partial knowledge of internal workings
- Combines benefits of black and white box
- Useful for integration testing

## QA Methodologies

**Waterfall QA**
- Testing occurs in distinct phase after development
- Comprehensive test plans upfront
- Works for well-defined, stable requirements
- Risk: defects found late are expensive

**Agile QA**
- Testing integrated throughout development
- Continuous testing in sprints
- Adaptive test strategies
- Faster feedback loops
- Requires QA and developers working closely together

**DevOps/Continuous Testing**
- Automated testing in CI/CD pipelines
- Tests run with every code commit
- Immediate feedback
- Requires strong automation infrastructure
- Enables faster, safer releases

**Test-Driven Development (TDD)**
- Write tests before writing code
- Code is written to pass tests
- Reduces defects significantly
- Can slow initial development

## QA Best Practices

**Requirements Clarity**
- Ensure requirements are clear, complete, and testable
- Get stakeholder buy-in early
- Define acceptance criteria upfront

**Test Planning**
- Create comprehensive test plans
- Prioritize test cases by risk and importance
- Plan for various testing types
- Allocate adequate resources

**Test Case Design**
- Cover normal scenarios, edge cases, and error conditions
- Use techniques like boundary testing and equivalence partitioning
- Make test cases reusable
- Keep them maintainable and understandable

**Automation Strategy**
- Automate repetitive, critical tests
- Balance automation with manual testing
- Maintain automated test suites carefully
- Not everything should be automated

**Defect Management**
- Clear defect reporting procedures
- Rapid communication of critical issues
- Track defect trends
- Root cause analysis

**Environment Management**
- Maintain test environments that mirror production
- Control environment data and configurations
- Ensure reproducibility of issues
- Minimize environment-related test failures

**Collaboration**
- QA involved early in planning
- Regular communication with developers
- Clear escalation procedures
- Shared responsibility for quality

## QA Tools & Technologies

**Test Management**
- TestRail, Zephyr, Azure Test Plans
- Track test cases, results, and coverage

**Automation Frameworks**
- Selenium (web automation)
- Appium (mobile automation)
- Cypress, Playwright (modern web testing)
- UFT, Ranorex (commercial tools)

**Performance Testing**
- JMeter, LoadRunner
- Gatling, Apache Bench
- Cloud-based services (Load Impact, Blaze Meter)

**Security Testing**
- OWASP ZAP, Burp Suite
- SonarQube (code quality and security)
- Snyk, Checkmarx

**CI/CD Integration**
- Jenkins, GitHub Actions, GitLab CI
- Azure DevOps, CircleCI
- Automated test execution on every commit

**Monitoring & Analytics**
- Datadog, New Relic, Splunk
- Real-time production monitoring
- User experience analytics

## QA Metrics & KPIs

**Defect Metrics**
- Defect density (defects per 1000 lines of code)
- Defect escape rate (defects found in production)
- Mean time to resolution
- Defect severity distribution

**Test Metrics**
- Test case coverage (% of requirements covered)
- Code coverage (% of code executed by tests)
- Test execution rate
- Pass/fail ratios

**Schedule Metrics**
- Testing time vs. planned time
- Defect detection rate over time
- Testing cycle time

**Efficiency Metrics**
- Cost per defect
- Return on automation investment
- Testing cost as % of development cost

## Common QA Challenges

**Scope Creep**
- Requirements changing mid-project
- Affects testing plans and timelines
- Requires flexibility and communication

**Time Pressure**
- Limited testing time before release
- Forces prioritization decisions
- May increase risk of missed defects

**Environment Issues**
- Difficult to replicate production
- Infrastructure limitations
- Data availability and confidentiality

**Automation Maintenance**
- Tests break when code changes
- Requires constant upkeep
- Can become expensive if not well-managed

**Skills Gaps**
- Need for technical expertise
- Emerging technologies require new skills
- Training and hiring challenges

**Communication Gaps**
- Misunderstanding between QA and development
- Unclear requirements
- Ineffective defect reporting

## QA in Different Domains

**Web Applications**
- Cross-browser testing
- Responsive design validation
- Performance under various network conditions

**Mobile Applications**
- Device fragmentation challenges
- OS version compatibility
- Network connectivity variability

**Enterprise Software**
- Integration with existing systems
- Compliance and security requirements
- Large-scale performance testing

**Healthcare/Regulated Industries**
- Compliance requirements (HIPAA, FDA, etc.)
- Extensive documentation needs
- High consequences for failures

**IoT/Embedded Systems**
- Hardware variability
- Real-time constraints
- Difficult debugging and reproduction

## The Future of QA

**AI-Powered Testing**
- Machine learning to generate test cases
- Predictive analysis for risk areas
- Self-healing automation scripts
- Anomaly detection in production

**Shift-Left Testing**
- Testing earlier in development cycle
- Developer involvement in testing
- Requirement validation testing
- Reduces time to fix issues

**Continuous Testing**
- Automated testing throughout development
- Real-time feedback
- Integration with DevOps pipelines
- Enables frequent releases

**Test Orchestration**
- Intelligent test scheduling
- Parallel execution optimization
- Risk-based test selection
- Resource optimization

**Quality Intelligence**
- Analytics and insights from test data
- Predictive quality metrics
- Trend analysis
- Better decision-making

## Key Takeaways

- QA is about preventing defects through systematic processes, not just finding bugs
- Quality Assurance differs from Quality Control—QA is proactive, QC is reactive
- Different testing types and approaches serve different purposes
- Automation is powerful but requires strategy and maintenance
- QA must be integrated throughout development, not as an afterthought
- Metrics and clear communication are essential for effectiveness
- Continuous improvement mindset drives better quality outcomes
- QA plays a critical business role—quality directly impacts customer satisfaction and costs

Quality Assurance is a discipline that requires technical skills, process discipline, and collaboration. Done well, it significantly reduces costs, improves customer satisfaction, and enables confident, rapid software delivery.`);
    }
  }, [agent, getPublicApplicationDetail]);

  useEffect(() => {
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => {
      window.removeEventListener('resize', checkHeight);
    };
  }, [checkHeight]);

  useEffect(() => {
    getDetails();
  }, [getDetails]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
    setIsDescriptionTruncated(false);
  }, [agent?.id]);

  useEffect(() => {
    if (!open || isDescriptionExpanded) return;
    const raf = requestAnimationFrame(() => {
      if (descriptionRef.current) {
        setIsDescriptionTruncated(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [open, isDescriptionExpanded, description]);

  const handleToggleDescription = useCallback(() => {
    setIsDescriptionExpanded(prev => !prev);
  }, []);

  const onShowContext = () => {
    setShowContext(true);
  };

  const onStartConversation = useCallback(
    selectedAgentStarter => () => {
      dispatch(
        actions.setSelectedAgentInfo({
          agent: {
            participantType: ChatParticipantType.Applications,
            ...agent,
            ...agentDetails,
            project_id: PUBLIC_PROJECT_ID,
            entity_name: ChatParticipantType.Agents,
            entity_meta: { id: agent.id, project_id: PUBLIC_PROJECT_ID },
            entity_settings: {
              agent_type: agentDetails.version_details.agent_type,
              llm_settings: agentDetails.version_details.llm_settings,
              variables: agentDetails.version_details.variables,
              version_id: agentDetails.version_details.id,
            },
            meta: { name: agentDetails.name, mcp: agentDetails.meta?.mcp },
            // Store the original latest version ID for comparison later
            originalLatestVersionId: agentDetails.version_details?.id,
          },
          starter: selectedAgentStarter,
        }),
      );
      setTimeout(() => {
        const newRouteStack = [
          {
            breadCrumb: 'Chat',
            viewMode: ViewMode.Owner,
            pagePath: RouteDefinitions.Chat,
          },
        ];
        navigate(
          { pathname: RouteDefinitions.Chat, search: 'create=1' },
          {
            replace: false,
            state: { routeStack: newRouteStack },
          },
        );
      }, 0);
    },
    [dispatch, agent, agentDetails, navigate],
  );

  const onSelectStarter = useCallback(
    starter => {
      onStartConversation?.(starter)();
      onClose();
    },
    [onStartConversation, onClose],
  );

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onStartConversation()();
      onClose();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onKeyDown={handleKeyDown}
        aria-labelledby="agent-modal-title"
        aria-describedby="agent-modal-description"
        sx={styles.dialog}
      >
        <Box
          sx={styles.mainPanel}
          data-testid="catalog-agent-modal"
        >
          <DialogTitle sx={styles.dialogTitle}>
            <Box sx={styles.authorContainer}>
              <AuthorContainer
                authors={cardAuthors}
                showName={false}
                style={styles.authorAvatars}
              />
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                data-testid="catalog-agent-modal-owner-name"
              >
                {cardAuthors[0]?.name || 'Author'}
              </Typography>
            </Box>
            <Box sx={styles.authorContainer}>
              <AgentHubLike
                viewMode={ViewMode.Public}
                data={agent?.name ? agent : agentDetails || {}}
                testId="catalog-agent-modal-like-button"
              />
              <AgentHubModalMenu
                agentId={agent?.id}
                agentName={name}
                versionId={versionId}
                link={link}
              />
              <IconButton
                data-testid="catalog-agent-modal-close-button"
                variant="elitea"
                color="secondary"
                aria-label="close"
                onClick={onClose}
                sx={{ padding: 0, margin: 0 }}
              >
                <CloseIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={styles.dialogContent(isSmallHeight)}>
              <Box sx={styles.iconContainer}>
                <EntityIcon
                  icon={icon_meta}
                  entityType={ChatParticipantType.Applications}
                  projectId={PUBLIC_PROJECT_ID}
                  editable={false}
                  data-testid="catalog-agent-modal-agent-icon"
                />
              </Box>
              <Typography
                variant="headingMedium"
                color="text.secondary"
                data-testid="catalog-agent-modal-agent-name"
              >
                {name}
              </Typography>
              <Typography
                ref={descriptionRef}
                variant="bodySmall2"
                sx={styles.description(isSmallHeight, isDescriptionExpanded)}
                data-testid="catalog-agent-modal-description"
              >
                {description}
              </Typography>
              {isDescriptionTruncated && (
                <Box sx={styles.showMoreRow}>
                  <SharedButton.BaseBtn
                    variant={BUTTON_VARIANTS.auxiliary}
                    onClick={handleToggleDescription}
                    data-testid="catalog-agent-modal-show-more-description"
                  >
                    <Typography variant="labelSmall">
                      {isDescriptionExpanded ? 'Show less' : 'Show more'}
                    </Typography>
                  </SharedButton.BaseBtn>
                </Box>
              )}
              <SharedButton.BaseBtn
                variant={BUTTON_VARIANTS.auxiliary}
                onClick={onShowContext}
                data-testid="catalog-agent-modal-show-instructions-link"
              >
                <Typography variant="labelSmall">Show instructions</Typography>
              </SharedButton.BaseBtn>
              <Box sx={styles.sectionsContainer(isSmallHeight)}>
                <AgentConversationStarters
                  conversation_starters={agentDetails?.version_details?.conversation_starters || []}
                  onSelectStarter={onSelectStarter}
                  testId="catalog-agent-modal-chat-starters-section"
                />
                <AgentWelcomeMessage
                  welcome_message={welcomeMessage}
                  testId="catalog-agent-modal-welcome-message-section"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>
            <Button
              data-tour={ELITEA_CATALOG_TOUR_TARGET_IDS.primaryActionButton}
              data-testid="catalog-agent-modal-start-chat-button"
              variant="elitea"
              color="primary"
              onClick={onStartConversation()}
            >
              Start Chat
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {showContext && (
        <AgentDetails.ConfigurationModal.StyledShowContextModal
          context={agentDetails?.version_details?.instructions || ''}
          open={showContext}
          onClose={() => setShowContext(false)}
          contextLabel="Instructions"
          isLoading={isFetching}
        />
      )}
    </>
  );
});

AgentModal.displayName = 'AgentModal';

/** @type {MuiSx} */
const agentModalStyles = () => ({
  authorAvatars: {
    minWidth: '1.25rem',
  },
  dialog: {
    '& .MuiDialog-paper': ({ palette }) => ({
      width: '37.5rem',
      maxWidth: '37.5rem',
      height: '41.875rem',
      borderRadius: '1rem',
      background: palette.components.agentModal.background.borderGradient,
      boxSizing: 'border-box',
      border: 'none !important',
      padding: '0.0625rem',
    }),
    '& .MuiDialogTitle-root': {
      margin: 0,
      width: '100%',
    },
    '& .MuiDialogContent-root': ({ palette }) => ({
      borderRadius: '1rem',
      background: palette.components.agentModal.background.borderGradient,
      margin: 0,
      width: '100%',
      border: 'none !important',
      padding: '0.0625rem 0 !important',
    }),
  },
  mainPanel: ({ palette }) => ({
    width: '100%',
    height: '100%',
    background: palette.components.agentModal.background.default,
    borderRadius: 'calc(1rem - 0.0625rem)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  }),
  dialogTitle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
  },
  authorContainer: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  dialogContent:
    isSmallHeight =>
    ({ palette }) => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      borderRadius: '1rem',
      padding: '1.5rem 2rem 2rem 2rem',
      backgroundColor: palette.background.default.secondary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      flex: 1,
      minHeight: 0,
      overflow: isSmallHeight ? 'auto' : 'hidden',
    }),
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
  },
  description:
    (isSmallHeight, isExpanded) =>
    ({ palette }) => ({
      textAlign: 'center',
      color: palette.text.metrics,
      lineHeight: '1.25rem',
      ...(isSmallHeight
        ? { width: '100%' }
        : {
            ...(!isExpanded && {
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }),
            ...(isExpanded && {
              overflowY: 'auto',
              maxHeight: '6rem',
              width: '100%',
            }),
          }),
    }),
  showMoreRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  dialogActions: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
    height: '3.75rem',
  },
  sectionsContainer: isSmallHeight => ({
    width: '100%',
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: isSmallHeight ? 'none' : 1,
    minHeight: isSmallHeight ? 'auto' : 0,
    overflowY: isSmallHeight ? 'visible' : 'auto',
    overflowX: 'hidden',
  }),
});

export default AgentModal;
