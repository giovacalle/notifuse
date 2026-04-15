package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Notifuse/notifuse/internal/domain"
	"github.com/Notifuse/notifuse/pkg/logger"
)

const (
	brevoAPIBaseURL = "https://api.brevo.com"
)

// BrevoService implements the domain.EmailProviderService interface for Brevo
type BrevoService struct {
	httpClient  domain.HTTPClient
	authService domain.AuthService
	logger      logger.Logger
}

// NewBrevoService creates a new instance of BrevoService
func NewBrevoService(httpClient domain.HTTPClient, authService domain.AuthService, logger logger.Logger) *BrevoService {
	return &BrevoService{
		httpClient:  httpClient,
		authService: authService,
		logger:      logger,
	}
}

// SendEmail sends an email using Brevo's HTTP API
func (s *BrevoService) SendEmail(ctx context.Context, request domain.SendEmailProviderRequest) error {
	// Validate the request
	if err := request.Validate(); err != nil {
		return fmt.Errorf("invalid request: %w", err)
	}

	if request.Provider.Brevo == nil {
		return fmt.Errorf("Brevo provider is not configured")
	}

	// Build the Brevo mail send request
	// https://developers.brevo.com/reference/sendtransacemail

	type EmailAddress struct {
		Email string `json:"email"`
		Name  string `json:"name,omitempty"`
	}

	type Attachment struct {
		Name    string `json:"name"`
		Content string `json:"content"` // Base64 encoded
		URL     string `json:"url,omitempty"`
	}

	type MailSendRequest struct {
		Sender      EmailAddress            `json:"sender"`
		To          []EmailAddress          `json:"to"`
		CC          []EmailAddress          `json:"cc,omitempty"`
		BCC         []EmailAddress          `json:"bcc,omitempty"`
		ReplyTo     *EmailAddress           `json:"replyTo,omitempty"`
		Subject     string                  `json:"subject"`
		HTMLContent string                  `json:"htmlContent"`
		Headers     map[string]string       `json:"headers,omitempty"`
		Params      map[string]string       `json:"params,omitempty"`
		Tags        []string                `json:"tags,omitempty"`
		Attachment  []Attachment            `json:"attachment,omitempty"`
	}

	mailReq := MailSendRequest{
		Sender: EmailAddress{
			Email: request.FromAddress,
			Name:  request.FromName,
		},
		To: []EmailAddress{{Email: request.To}},
		Subject:     request.Subject,
		HTMLContent: request.Content,
		Tags:        []string{request.MessageID},
		Params: map[string]string{
			"notifuse_message_id": request.MessageID,
		},
	}

	// Add CC recipients
	for _, cc := range request.EmailOptions.CC {
		if cc != "" {
			mailReq.CC = append(mailReq.CC, EmailAddress{Email: cc})
		}
	}

	// Add BCC recipients
	for _, bcc := range request.EmailOptions.BCC {
		if bcc != "" {
			mailReq.BCC = append(mailReq.BCC, EmailAddress{Email: bcc})
		}
	}

	// Add reply-to if specified
	if request.EmailOptions.ReplyTo != "" {
		mailReq.ReplyTo = &EmailAddress{Email: request.EmailOptions.ReplyTo}
	}

	// Add RFC-8058 List-Unsubscribe headers for one-click unsubscribe
	if request.EmailOptions.ListUnsubscribeURL != "" {
		mailReq.Headers = map[string]string{
			"List-Unsubscribe":      fmt.Sprintf("<%s>", request.EmailOptions.ListUnsubscribeURL),
			"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
		}
	}

	// Add attachments if specified
	if len(request.EmailOptions.Attachments) > 0 {
		for i, att := range request.EmailOptions.Attachments {
			// Validate content can be decoded
			_, err := att.DecodeContent()
			if err != nil {
				return fmt.Errorf("attachment %d: failed to decode content: %w", i, err)
			}

			// Brevo expects base64 content without the data URI prefix
			content := att.Content
			// If content is raw bytes, encode to base64
			if _, err := base64.StdEncoding.DecodeString(content); err != nil {
				content = base64.StdEncoding.EncodeToString([]byte(content))
			}

			mailReq.Attachment = append(mailReq.Attachment, Attachment{
				Name:    att.Filename,
				Content: content,
			})

			s.logger.WithField("filename", att.Filename).
				Debug("Added attachment to Brevo request")
		}
	}

	// Convert to JSON
	jsonData, err := json.Marshal(mailReq)
	if err != nil {
		return fmt.Errorf("failed to marshal email request: %w", err)
	}

	// Create HTTP request
	apiURL := fmt.Sprintf("%s/v3/smtp/email", brevoAPIBaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to create request for sending Brevo email: %v", err))
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers - Brevo uses api-key header, not Bearer token
	req.Header.Set("api-key", request.Provider.Brevo.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Send the request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to execute request for sending Brevo email: %v", err))
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	// Brevo returns 201 Created on success
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		s.logger.Error(fmt.Sprintf("Brevo API returned non-OK status code %d: %s", resp.StatusCode, string(body)))
		return fmt.Errorf("API returned non-OK status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
