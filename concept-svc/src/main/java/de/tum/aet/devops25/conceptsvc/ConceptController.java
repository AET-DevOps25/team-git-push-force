package de.tum.aet.devops25.conceptsvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;

import de.tum.aet.devops25.api.generated.controller.ConceptsApi;
import de.tum.aet.devops25.api.generated.model.ApplyConceptSuggestionRequest;
import de.tum.aet.devops25.api.generated.model.Concept;
import de.tum.aet.devops25.api.generated.model.CreateConceptRequest;
import de.tum.aet.devops25.api.generated.model.GetUserConcepts200Response;
import de.tum.aet.devops25.api.generated.model.UpdateConceptRequest;

@RestController
public class ConceptController implements ConceptsApi {

    private final ConceptRepository conceptRepository;
    private final PdfService pdfService;

    public ConceptController(ConceptRepository conceptRepository, PdfService pdfService) {
        this.conceptRepository = conceptRepository;
        this.pdfService = pdfService;
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString((String) auth.getPrincipal());
    }

    @Override
    public ResponseEntity<GetUserConcepts200Response> getUserConcepts(Integer page, Integer size, String status) {
        UUID userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        
        Page<ConceptEntity> conceptsPage;
        if (status != null) {
            ConceptStatus conceptStatus = ConceptStatus.valueOf(status);
            conceptsPage = conceptRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, conceptStatus, pageable);
        } else {
            conceptsPage = conceptRepository.findByUserIdOrderByUpdatedAtDesc(userId, pageable);
        }
        
        List<Concept> conceptDtos = conceptsPage.getContent().stream()
                .map(ConceptMapper::toDto)
                .collect(Collectors.toList());
        
        GetUserConcepts200Response response = new GetUserConcepts200Response();
        response.setContent(conceptDtos);
        response.setTotalElements((int) conceptsPage.getTotalElements());
        response.setTotalPages(conceptsPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<Concept> createConcept(CreateConceptRequest createConceptRequest) {
        UUID userId = getCurrentUserId();
        
        ConceptEntity entity = new ConceptEntity();
        entity.setTitle(createConceptRequest.getTitle());
        entity.setDescription(createConceptRequest.getDescription());
        entity.setStatus(ConceptStatus.DRAFT);
        entity.setUserId(userId);
        entity.setLastModifiedBy(userId);
        // Note: createdAt/updatedAt handled by @CreatedDate/@LastModifiedDate
        
        if (createConceptRequest.getTags() != null) {
            entity.setTags(new ArrayList<>(createConceptRequest.getTags()));
        }
        
        // Map initial requirements to eventDetails
        if (createConceptRequest.getInitialRequirements() != null) {
            EventDetailsEntity eventDetails = new EventDetailsEntity();
            var reqs = createConceptRequest.getInitialRequirements();
            
            eventDetails.setCapacity(reqs.getExpectedCapacity());
            eventDetails.setDuration(reqs.getDuration());
            eventDetails.setTargetAudience(reqs.getTargetAudience());
            eventDetails.setTheme(reqs.getTheme());
            eventDetails.setStartDate(reqs.getStartDate());
            eventDetails.setEndDate(reqs.getEndDate());
            
            if (reqs.getPreferredFormat() != null) {
                eventDetails.setFormat(EventFormat.valueOf(reqs.getPreferredFormat().getValue()));
            }
            
            entity.setEventDetails(eventDetails);
        }
        
        ConceptEntity saved = conceptRepository.save(entity);
        return ResponseEntity.status(201).body(ConceptMapper.toDto(saved));
    }

    @Override
    public ResponseEntity<Concept> getConceptById(UUID conceptId) {
        UUID userId = getCurrentUserId();
        
        Optional<ConceptEntity> conceptOpt = conceptRepository.findByIdAndUserId(conceptId, userId);
        if (conceptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(ConceptMapper.toDto(conceptOpt.get()));
    }

    @Override
    public ResponseEntity<Concept> updateConcept(UUID conceptId, UpdateConceptRequest updateConceptRequest) {
        UUID userId = getCurrentUserId();
        
        Optional<ConceptEntity> conceptOpt = conceptRepository.findByIdAndUserId(conceptId, userId);
        if (conceptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        ConceptEntity entity = conceptOpt.get();
        
        // Use existing mapper method
        ConceptMapper.updateEntityFromRequest(entity, updateConceptRequest);
        entity.setLastModifiedBy(userId);
        // updatedAt handled automatically by @LastModifiedDate
        
        ConceptEntity saved = conceptRepository.save(entity);
        return ResponseEntity.ok(ConceptMapper.toDto(saved));
    }

    @Override
    public ResponseEntity<Void> deleteConcept(UUID conceptId, Boolean permanent) {
        UUID userId = getCurrentUserId();
        
        Optional<ConceptEntity> conceptOpt = conceptRepository.findByIdAndUserId(conceptId, userId);
        if (conceptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        ConceptEntity entity = conceptOpt.get();
        
        if (Boolean.TRUE.equals(permanent)) {
            // Hard delete
            conceptRepository.delete(entity);
        } else {
            // Soft delete - set status to ARCHIVED
            entity.setStatus(ConceptStatus.ARCHIVED);
            entity.setLastModifiedBy(userId);
            conceptRepository.save(entity);
        }
        
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Resource> downloadConceptPdf(UUID conceptId) {
        UUID userId = getCurrentUserId();
        
        Optional<ConceptEntity> conceptOpt = conceptRepository.findByIdAndUserId(conceptId, userId);
        if (conceptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            Resource pdfResource = pdfService.generateConceptPdf(conceptOpt.get());
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=concept-" + conceptId + ".pdf")
                    .body(pdfResource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Override
    public ResponseEntity<Concept> applyConceptSuggestion(UUID conceptId, ApplyConceptSuggestionRequest request) {
        UUID userId = getCurrentUserId();
        
        Optional<ConceptEntity> conceptOpt = conceptRepository.findByIdAndUserId(conceptId, userId);
        if (conceptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // Mock implementation - just return existing concept with note
        ConceptEntity entity = conceptOpt.get();
        entity.setNotes("AI suggestion applied (mock implementation)");
        entity.setLastModifiedBy(userId);
        
        ConceptEntity saved = conceptRepository.save(entity);
        return ResponseEntity.ok(ConceptMapper.toDto(saved));
    }
} 