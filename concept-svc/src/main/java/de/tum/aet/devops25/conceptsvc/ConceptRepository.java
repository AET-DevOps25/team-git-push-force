package de.tum.aet.devops25.conceptsvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConceptRepository extends JpaRepository<ConceptEntity, UUID> {

    // From implementation plan: findByUserIdOrderByUpdatedAtDesc(UUID userId)
    List<ConceptEntity> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    // From implementation plan: findByUserIdAndStatus(UUID userId, String status)
    List<ConceptEntity> findByUserIdAndStatus(UUID userId, ConceptStatus status);

    // From implementation plan: paginated queries if needed (required by OpenAPI spec)
    Page<ConceptEntity> findByUserIdOrderByUpdatedAtDesc(UUID userId, Pageable pageable);

    Page<ConceptEntity> findByUserIdAndStatusOrderByUpdatedAtDesc(UUID userId, ConceptStatus status, Pageable pageable);

    // Essential for ownership verification in controllers (get/update/delete operations)
    Optional<ConceptEntity> findByIdAndUserId(UUID id, UUID userId);
} 